import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DragEndEvent, DndContext, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Wine, Settings, GripVertical } from "lucide-react";
import WineyHeader from "@/components/winey-header";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";

interface SortableWineProps {
  wine: any;
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-3 p-4 bg-white border rounded-lg touch-manipulation min-h-[120px] w-full shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? "shadow-lg opacity-50" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing w-full h-full flex flex-col gap-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {String.fromCharCode(65 + index)}
          </div>
          <div className="text-sm font-semibold text-green-700">${wine.price}</div>
          <GripVertical className="h-4 w-4 text-gray-400 ml-auto" />
        </div>
        <div className="text-sm font-medium text-gray-900 leading-relaxed">
          {wine.labelName}
        </div>
        {wine.funName && (
          <div className="text-xs text-gray-600 leading-relaxed">
            {wine.funName}
          </div>
        )}
      </div>
    </div>
  );
}

interface RoundCardProps {
  round: number;
  wines: any[];
  onDrop: (wineId: string, roundIndex: number) => void;
  bottlesPerRound: number;
}

function RoundCard({ round, wines, onDrop, bottlesPerRound }: RoundCardProps) {
  return (
    <Card className="min-h-[250px] md:min-h-[300px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base md:text-lg">
          <span>Round {round + 1}</span>
          <Badge variant={wines.length === bottlesPerRound ? "default" : "secondary"} className="text-xs">
            {wines.length}/{bottlesPerRound}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] md:min-h-[250px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {wines.map((wine, index) => (
              <SortableWine key={wine.id} wine={wine} index={index} />
            ))}
          </div>
          {wines.length === 0 && (
            <div className="text-center text-gray-400 py-6 md:py-8 text-sm">
              Drag wines here
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

  // Fetch game data using the hook
  const { data: gameData, isLoading, error } = useGame(gameId!);

  // Fetch bottles
  const { data: bottlesData } = useQuery({
    queryKey: ["/api/games", gameId, "bottles"],
    queryFn: () => apiRequest("GET", `/api/games/${gameId}/bottles`).then(res => res.json()),
    enabled: !!gameId,
  });

  const [rounds, setRounds] = useState<any[][]>([]);
  const [unassignedWines, setUnassignedWines] = useState<any[]>([]);

  // Initialize rounds when game data is available
  useEffect(() => {
    if (gameData?.game && bottlesData?.bottles) {
      const totalRounds = gameData.game.totalRounds || 4;
      const bottlesPerRound = gameData.game.bottlesPerRound || 4;
      
      // Initialize empty rounds
      const emptyRounds = Array(totalRounds).fill(null).map(() => []);
      setRounds(emptyRounds);
      
      // Set all bottles as unassigned initially
      setUnassignedWines([...bottlesData.bottles]);
    }
  }, [gameData, bottlesData]);

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

  const totalRounds = gameData.game.totalRounds || 4;
  const bottlesPerRound = gameData.game.bottlesPerRound || 4;

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container mx-auto p-4 space-y-4">
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
          {/* Mobile-first layout */}
          <div className="space-y-4">
            {/* Available Wines - Always at top on mobile */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Available Wines</span>
                  <Badge variant="secondary">
                    {unassignedWines.length} remaining
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SortableContext 
                  items={unassignedWines.map(w => w.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="max-h-60 md:max-h-80 overflow-y-auto" id="unassigned">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unassignedWines.map((wine, index) => (
                        <SortableWine key={wine.id} wine={wine} index={index} />
                      ))}
                    </div>
                    {unassignedWines.length === 0 && (
                      <div className="text-center text-gray-400 py-4">
                        All wines assigned
                      </div>
                    )}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>

            {/* Rounds - Stack vertically on mobile, grid on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {rounds.map((roundWines, roundIndex) => (
                <div key={roundIndex} id={`round-${roundIndex}`}>
                  <SortableContext 
                    items={roundWines.map(w => w.id)}
                    strategy={rectSortingStrategy}
                  >
                    <RoundCard
                      round={roundIndex}
                      wines={roundWines}
                      onDrop={() => {}}
                      bottlesPerRound={bottlesPerRound}
                    />
                  </SortableContext>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-6 pb-4">
            <Button
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
              size="lg"
              className="px-6 py-3 w-full md:w-auto"
            >
              {finalizeMutation.isPending ? "Finalizing..." : "🎯 Finalize Rounds & Start Game"}
            </Button>
          </div>
        </DndContext>
      </div>
    </div>
  );
}