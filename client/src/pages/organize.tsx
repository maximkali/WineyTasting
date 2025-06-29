import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DragEndEvent, DndContext, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
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
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-shrink-0 w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
        {String.fromCharCode(65 + index)}
      </div>
      <div className="flex-1">
        <div className="font-medium">{wine.labelName}</div>
        {wine.funName && (
          <div className="text-sm text-gray-500">{wine.funName}</div>
        )}
      </div>
      <div className="text-sm font-medium">${wine.price}</div>
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
    <Card className="min-h-[300px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Round {round + 1}</span>
          <Badge variant={wines.length === bottlesPerRound ? "default" : "secondary"}>
            {wines.length}/{bottlesPerRound} wines
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 min-h-[200px]">
          {wines.map((wine, index) => (
            <SortableWine key={wine.id} wine={wine} index={index} />
          ))}
          {wines.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              Drag wines here
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Organize() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gameData, isLoading } = useGame(gameId!);
  const [rounds, setRounds] = useState<any[][]>([]);
  const [unassignedWines, setUnassignedWines] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get host token from localStorage
  const hostToken = typeof window !== 'undefined' ? localStorage.getItem('hostToken') : null;

  // Initialize rounds and wines when data loads
  useEffect(() => {
    if (gameData?.bottles && gameData?.game) {
      const totalRounds = gameData.game.totalRounds || 4;
      const newRounds = Array.from({ length: totalRounds }, () => []);
      setRounds(newRounds);
      setUnassignedWines([...gameData.bottles]);
    }
  }, [gameData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const wineId = active.id as string;
    const wine = [...unassignedWines, ...rounds.flat()].find(w => w.id === wineId);
    
    if (!wine) return;

    // Parse the drop target
    const overIdStr = over.id as string;
    
    if (overIdStr.startsWith("round-")) {
      const roundIndex = parseInt(overIdStr.split("-")[1]);
      const bottlesPerRound = gameData?.game?.bottlesPerRound || 4;
      
      if (rounds[roundIndex].length >= bottlesPerRound) {
        toast({
          title: "Round Full",
          description: `Round ${roundIndex + 1} already has ${bottlesPerRound} wines.`,
          variant: "destructive",
        });
        return;
      }

      // Remove wine from current location
      const newUnassigned = unassignedWines.filter(w => w.id !== wineId);
      const newRounds = rounds.map((round, index) => 
        index === roundIndex 
          ? [...round.filter(w => w.id !== wineId), wine]
          : round.filter(w => w.id !== wineId)
      );

      setUnassignedWines(newUnassigned);
      setRounds(newRounds);
    } else if (overIdStr === "unassigned") {
      // Move back to unassigned
      const newUnassigned = [...unassignedWines.filter(w => w.id !== wineId), wine];
      const newRounds = rounds.map(round => round.filter(w => w.id !== wineId));
      
      setUnassignedWines(newUnassigned);
      setRounds(newRounds);
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

      if (!response.ok) {
        throw new Error("Failed to create rounds");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Wine rounds have been organized. Game is ready to start!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
      setLocation(`/lobby/${gameId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to organize rounds. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFinalize = () => {
    const totalWines = rounds.flat().length;
    const expectedWines = gameData?.game?.totalBottles || 0;
    
    if (totalWines !== expectedWines) {
      toast({
        title: "Incomplete Organization",
        description: `Please assign all ${expectedWines} wines to rounds.`,
        variant: "destructive",
      });
      return;
    }

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Game not found</div>
      </div>
    );
  }

  const totalRounds = gameData.game?.totalRounds || 4;
  const bottlesPerRound = gameData.game?.bottlesPerRound || 4;

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Organize Wine Rounds</h1>
          <p className="text-gray-600">
            Drag and drop wines to organize them into {totalRounds} rounds of {bottlesPerRound} wines each
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Unassigned Wines */}
            <div className="lg:col-span-1">
              <Card className="min-h-[400px]">
                <CardHeader>
                  <CardTitle>
                    Available Wines
                    <Badge variant="secondary" className="ml-2">
                      {unassignedWines.length} remaining
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SortableContext 
                    items={unassignedWines.map(w => w.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2" id="unassigned">
                      {unassignedWines.map((wine, index) => (
                        <SortableWine key={wine.id} wine={wine} index={index} />
                      ))}
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            </div>

            {/* Rounds */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rounds.map((roundWines, roundIndex) => (
                  <div key={roundIndex} id={`round-${roundIndex}`}>
                    <SortableContext 
                      items={roundWines.map(w => w.id)}
                      strategy={verticalListSortingStrategy}
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
          </div>

          <div className="text-center pt-6">
            <Button
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
              size="lg"
              className="px-8"
            >
              {finalizeMutation.isPending ? "Finalizing..." : "🎯 Finalize Rounds & Start Game"}
            </Button>
          </div>
        </DndContext>
      </div>
    </div>
  );
}