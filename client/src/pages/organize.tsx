import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from "lucide-react";
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
  originalIndex?: number;
}

interface WineTileProps {
  wine: Wine;
  index: number;
  onRemove?: () => void;
}

function WineTile({ wine, index, onRemove }: WineTileProps) {
  return (
    <div className="bg-white border rounded-lg w-full shadow-sm hover:shadow-md transition-shadow">
      <div className="w-full h-full flex items-center gap-3 p-3">
        {/* Avatar on the left */}
        <div className="w-8 h-8 bg-wine text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
          {String.fromCharCode(65 + (wine.originalIndex ?? index))}
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
        
        {/* Price and remove button on the right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-wine">${wine.price}</span>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface WineSelectionModalProps {
  availableWines: Wine[];
  onSelectWines: (wineIds: string[]) => void;
  maxSelections: number;
  roundNumber: number;
}

function WineSelectionModal({ availableWines, onSelectWines, maxSelections, roundNumber }: WineSelectionModalProps) {
  const [selectedWineIds, setSelectedWineIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleWineToggle = (wineId: string) => {
    setSelectedWineIds(prev => {
      if (prev.includes(wineId)) {
        return prev.filter(id => id !== wineId);
      } else if (prev.length < maxSelections) {
        return [...prev, wineId];
      }
      return prev;
    });
  };

  const handleDone = () => {
    onSelectWines(selectedWineIds);
    setSelectedWineIds([]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedWineIds([]);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center gap-2"
        >
          <Plus className="h-6 w-6 text-gray-400" />
          <span className="text-sm text-gray-600">Add wines to Round {roundNumber + 1}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select wines for Round {roundNumber + 1} (max {maxSelections})</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="h-96 w-full border rounded-md p-4">
            <div className="space-y-3">
              {availableWines.map((wine, index) => (
                <div key={wine.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                  <Checkbox
                    id={wine.id}
                    checked={selectedWineIds.includes(wine.id)}
                    onCheckedChange={() => handleWineToggle(wine.id)}
                    disabled={!selectedWineIds.includes(wine.id) && selectedWineIds.length >= maxSelections}
                  />
                  <div className="flex-1">
                    <WineTile wine={wine} index={index} />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedWineIds.length} of {maxSelections} selected
            </span>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleDone} disabled={selectedWineIds.length === 0}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface RoundCardProps {
  round: number;
  wines: Wine[];
  bottlesPerRound: number;
  availableWines: Wine[];
  onAddWines: (roundIndex: number, wineIds: string[]) => void;
  onRemoveWine: (roundIndex: number, wineId: string) => void;
}

function RoundCard({ round, wines, bottlesPerRound, availableWines, onAddWines, onRemoveWine }: RoundCardProps) {
  const canAddMore = wines.length < bottlesPerRound;
  const maxNewSelections = bottlesPerRound - wines.length;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Round {round + 1}
          <Badge variant="secondary" className="text-xs">
            {wines.length}/{bottlesPerRound}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Wine tiles */}
        {wines.map((wine, index) => (
          <WineTile
            key={wine.id}
            wine={wine}
            index={index}
            onRemove={() => onRemoveWine(round, wine.id)}
          />
        ))}
        
        {/* Add wine button */}
        {canAddMore && availableWines.length > 0 && (
          <WineSelectionModal
            availableWines={availableWines}
            onSelectWines={(wineIds) => onAddWines(round, wineIds)}
            maxSelections={maxNewSelections}
            roundNumber={round}
          />
        )}
        
        {/* Full round message */}
        {!canAddMore && (
          <div className="text-center text-sm text-gray-500 py-4">
            Round is full
          </div>
        )}
        
        {/* No available wines message */}
        {canAddMore && availableWines.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-4">
            No wines available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Organize() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get host token from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const hostToken = searchParams.get('hostToken');

  // Game data using the hook
  const { data: gameData, isLoading, isError } = useGame(gameId!);
  
  const [wines, setWines] = useState<Wine[]>([]);
  const [rounds, setRounds] = useState<Wine[][]>([]);

  // Update wines state when game data changes
  useEffect(() => {
    if (gameData?.bottles) {
      console.log("Setting up", gameData.game.totalRounds, "rounds with", gameData.bottles.length, "bottles");
      
      const wineData: Wine[] = gameData.bottles.map((bottle: any, index: number) => ({
        id: bottle.id,
        labelName: bottle.labelName,
        funName: bottle.funName,
        price: bottle.price,
        originalIndex: index
      }));
      
      setWines(wineData);
      
      // Initialize rounds based on existing assignments
      const newRounds: Wine[][] = Array(gameData.game.totalRounds).fill(null).map(() => []);
      
      // Organize wines into rounds based on their roundIndex
      wineData.forEach(wine => {
        const bottle = gameData.bottles.find((b: any) => b.id === wine.id);
        if (bottle && bottle.roundIndex !== null && bottle.roundIndex >= 0) {
          if (newRounds[bottle.roundIndex]) {
            newRounds[bottle.roundIndex].push(wine);
          }
        }
      });
      
      setRounds(newRounds);
    }
  }, [gameData]);

  // Calculate unassigned wines
  const assignedWineIds = new Set(rounds.flat().map(w => w.id));
  const unassignedWines = wines.filter(w => !assignedWineIds.has(w.id));

  // Mutation to save bottle assignments
  const updateBottlesMutation = useMutation({
    mutationFn: async (roundData: { roundIndex: number; bottleIds: string[] }[]) => {
      const result = await apiRequest(`/api/games/${gameId}/bottles/organize`, {
        method: "POST",
        body: JSON.stringify({ rounds: roundData }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${hostToken}`
        }
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({
        title: "Bottles organized successfully",
        description: "Wine assignments have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error organizing bottles",
        description: error.message || "Failed to save wine assignments.",
        variant: "destructive",
      });
    },
  });

  const handleAddWinesToRound = (roundIndex: number, wineIds: string[]) => {
    setRounds(prev => {
      const newRounds = [...prev];
      const winesToAdd = wines.filter(w => wineIds.includes(w.id));
      newRounds[roundIndex] = [...newRounds[roundIndex], ...winesToAdd];
      return newRounds;
    });
  };

  const handleRemoveWineFromRound = (roundIndex: number, wineId: string) => {
    setRounds(prev => {
      const newRounds = [...prev];
      newRounds[roundIndex] = newRounds[roundIndex].filter(w => w.id !== wineId);
      return newRounds;
    });
  };

  const handleSaveOrganization = async () => {
    const roundData = rounds.map((roundWines, roundIndex) => ({
      roundIndex,
      bottleIds: roundWines.map(w => w.id)
    }));

    updateBottlesMutation.mutate(roundData);
  };

  const handleStartGame = async () => {
    try {
      await apiRequest(`/api/games/${gameId}/start`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hostToken}`
        }
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({
        title: "Game started!",
        description: "Players can now join the lobby.",
      });
      
      navigate(`/lobby/${gameId}?hostToken=${hostToken}`);
    } catch (error: any) {
      toast({
        title: "Error starting game",
        description: error.message || "Failed to start the game.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading game data</div>;
  if (!gameData) return <div>Game not found</div>;

  const { game } = gameData;
  const totalAssigned = rounds.reduce((sum, round) => sum + round.length, 0);
  const allBottlesAssigned = totalAssigned === wines.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Organize Wines into Rounds
          </h1>
          <p className="text-gray-600">
            Assign your {wines.length} wines to {game.totalRounds} rounds ({game.bottlesPerRound} wines per round)
          </p>
        </div>

        {/* Progress indicator */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Progress</p>
                <p className="text-xs text-gray-600">
                  {totalAssigned} of {wines.length} wines assigned
                </p>
              </div>
              <Badge variant={allBottlesAssigned ? "default" : "secondary"}>
                {allBottlesAssigned ? "Complete" : "In Progress"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rounds grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {rounds.map((roundWines, roundIndex) => (
            <RoundCard
              key={roundIndex}
              round={roundIndex}
              wines={roundWines}
              bottlesPerRound={game.bottlesPerRound}
              availableWines={unassignedWines}
              onAddWines={handleAddWinesToRound}
              onRemoveWine={handleRemoveWineFromRound}
            />
          ))}
        </div>

        {/* Unassigned wines */}
        {unassignedWines.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Unassigned Wines
                <Badge variant="outline">
                  {unassignedWines.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedWines.map((wine, index) => (
                  <WineTile key={wine.id} wine={wine} index={index} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleSaveOrganization}
            disabled={updateBottlesMutation.isPending}
            variant="outline"
          >
            {updateBottlesMutation.isPending ? "Saving..." : "Save Organization"}
          </Button>
          
          <Button
            onClick={handleStartGame}
            disabled={!allBottlesAssigned}
            className="bg-wine hover:bg-wine/90"
          >
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
}