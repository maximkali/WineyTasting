import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DragEndEvent, DndContext, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import WineyHeader from "@/components/winey-header";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";

interface Wine {
  id: string;
  labelName: string;
  funName: string | null;
  price: number;
}

interface SortableWineProps {
  wine: Wine;
  index: number;
}

function SortableWine({ wine, index }: SortableWineProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wine.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg touch-manipulation w-full shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? "shadow-lg opacity-50" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing w-full h-full flex items-center gap-3 p-3"
      >
        {/* Avatar on the left */}
        <div className="w-8 h-8 bg-wine text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
          {wine.labelName.charAt(0).toUpperCase()}
        </div>
        
        {/* Wine info in the center - takes up available space */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs text-gray-900 leading-tight truncate">
            {wine.labelName}
          </div>
          {wine.funName && (
            <div className="text-xs text-gray-600 leading-tight truncate">
              "{wine.funName}"
            </div>
          )}
        </div>
        
        {/* Price and drag handle on the right */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-sm font-bold text-wine">${wine.price}</span>
          <GripVertical className="h-3 w-3 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

interface AvailableWinesCardProps {
  wines: Wine[];
}

function AvailableWinesCard({ wines }: AvailableWinesCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unassigned',
  });
  
  const style = {
    backgroundColor: isOver ? 'rgba(34, 197, 94, 0.1)' : undefined,
  };
  
  return (
    <Card 
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'border-green-500 bg-green-50' : ''}`}
      style={style}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Available Wines</span>
          <Badge variant="secondary">
            {wines.length} remaining
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SortableContext 
          items={wines.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {wines.map((wine, index) => (
              <SortableWine key={wine.id} wine={wine} index={index} />
            ))}
          </div>
          {wines.length === 0 && (
            <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
              All wines assigned to rounds
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

interface RoundCardProps {
  round: number;
  wines: Wine[];
  bottlesPerRound: number;
}

function RoundCard({ round, wines, bottlesPerRound }: RoundCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `round-${round}`,
  });
  
  const style = {
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : undefined,
  };
  
  return (
    <Card 
      ref={setNodeRef}
      className={`min-h-[250px] transition-colors ${isOver ? 'border-blue-500 bg-blue-50' : ''}`}
      style={style}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Round {round + 1}</span>
          <Badge variant={wines.length === bottlesPerRound ? "default" : "secondary"} className="text-xs">
            {wines.length}/{bottlesPerRound}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wines.map((wine, index) => (
              <SortableWine key={wine.id} wine={wine} index={index} />
            ))}
          </div>
          {wines.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm border-2 border-dashed border-gray-300 rounded-lg">
              Drop wines here
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Organize() {
  const { gameId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hostToken = sessionStorage.getItem(`hostToken_${gameId}`);
  
  useEffect(() => {
    if (!hostToken) {
      navigate("/");
    }
  }, [hostToken, navigate]);

  if (!hostToken) {
    return null;
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch game data
  const { data: gameData, isLoading, error } = useGame(gameId!) as {
    data: {
      game: any;
      bottles: Wine[];
      players: any[];
      rounds: any[];
    } | undefined;
    isLoading: boolean;
    error: any;
  };

  const [rounds, setRounds] = useState<Wine[][]>([]);
  const [unassignedWines, setUnassignedWines] = useState<Wine[]>([]);

  // Initialize rounds when game data is available
  useEffect(() => {
    console.log("Full game data:", gameData);
    
    if (gameData?.bottles && Array.isArray(gameData.bottles)) {
      const totalRounds = gameData.game.totalRounds || 5;
      
      console.log("Setting up", totalRounds, "rounds with", gameData.bottles.length, "bottles");
      
      // Initialize empty rounds
      const emptyRounds = Array(totalRounds).fill(null).map(() => []);
      setRounds(emptyRounds);
      
      // Set all bottles as unassigned initially
      setUnassignedWines([...gameData.bottles]);
    } else {
      console.log("No bottles found in game data", gameData);
    }
  }, [gameData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const wineId = active.id as string;
    const wine = [...unassignedWines, ...rounds.flat()].find(w => w.id === wineId);
    if (!wine) return;

    // Remove wine from current location
    const newUnassignedWines = unassignedWines.filter(w => w.id !== wineId);
    const newRounds = rounds.map(round => round.filter(w => w.id !== wineId));

    // Determine destination
    if (over.id === "unassigned") {
      // Moving to unassigned
      setUnassignedWines([...newUnassignedWines, wine]);
      setRounds(newRounds);
    } else if (over.id.toString().startsWith("round-")) {
      // Moving to a round
      const roundIndex = parseInt(over.id.toString().replace("round-", ""));
      const bottlesPerRound = gameData?.game?.bottlesPerRound || 4;
      
      if (newRounds[roundIndex].length < bottlesPerRound) {
        newRounds[roundIndex] = [...newRounds[roundIndex], wine];
        setUnassignedWines(newUnassignedWines);
        setRounds(newRounds);
      } else {
        // Round is full, show toast
        toast({
          title: "Round Full",
          description: `Round ${roundIndex + 1} already has ${bottlesPerRound} wines.`,
          variant: "destructive",
        });
      }
    }
  };

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      // Create rounds data structure
      const roundsData = rounds.map((roundWines, index) => ({
        index,
        bottles: roundWines.map(wine => wine.id),
      }));

      const response = await apiRequest("POST", `/api/games/${gameId}/rounds`, {
        rounds: roundsData,
      }, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Rounds finalized and game started.",
      });
      navigate(`/lobby/${gameId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to finalize rounds",
        variant: "destructive",
      });
    },
  });

  const handleFinalize = () => {
    // Check if all wines are assigned
    if (unassignedWines.length > 0) {
      toast({
        title: "Incomplete Setup",
        description: `Please assign all ${unassignedWines.length} remaining wines to rounds.`,
        variant: "destructive",
      });
      return;
    }

    // Check if all rounds have the correct number of bottles
    const bottlesPerRound = gameData?.game?.bottlesPerRound || 4;
    const incompleteRounds = rounds.filter(round => round.length !== bottlesPerRound);
    if (incompleteRounds.length > 0) {
      toast({
        title: "Incomplete Rounds",
        description: `Each round must have exactly ${bottlesPerRound} wines.`,
        variant: "destructive",
      });
      return;
    }

    finalizeMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error || !gameData?.game) {
    return <div className="flex justify-center items-center min-h-screen">Game not found</div>;
  }

  const totalRounds = gameData.game.totalRounds || 5;
  const bottlesPerRound = gameData.game.bottlesPerRound || 4;

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Organize Wine Rounds</h1>
          <p className="text-gray-600 text-sm md:text-base">
            Drag and drop wines to organize them into {totalRounds} rounds of {bottlesPerRound} wines each
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          {/* Available Wines - Horizontal layout at top */}
          <AvailableWinesCard wines={unassignedWines} />

          {/* Rounds */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rounds.map((roundWines, roundIndex) => (
              <RoundCard
                key={roundIndex}
                round={roundIndex}
                wines={roundWines}
                bottlesPerRound={bottlesPerRound}
              />
            ))}
          </div>

          <div className="text-center pt-6">
            <Button
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
              size="lg"
              className="px-8 py-3"
            >
              {finalizeMutation.isPending ? "Finalizing..." : "🎯 Finalize Rounds & Start Game"}
            </Button>
          </div>
        </DndContext>
      </div>
    </div>
  );
}