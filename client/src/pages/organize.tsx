import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, ArrowLeft } from "lucide-react";
import WineyHeader from "@/components/winey-header";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const totalCost = wines.reduce((sum, wine) => sum + wine.price, 0);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Round {round + 1}
          <Badge 
            variant={wines.length === bottlesPerRound ? "destructive" : "secondary"} 
            className="text-xs"
          >
            {wines.length}/{bottlesPerRound}
          </Badge>
          <span className="text-sm font-normal text-gray-600">
            Sum: ${Math.round(totalCost)}
          </span>
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

  // Get host token from session storage (consistent with setup page)
  const hostToken = sessionStorage.getItem(`game-${gameId}-hostToken`);

  // Game data using the hook
  const { data: gameData, isLoading, isError } = useGame(gameId!);

  // Fetch bottles data separately
  const { data: bottlesData, isLoading: bottlesLoading } = useQuery({
    queryKey: [`/api/games/${gameId}/bottles`],
    enabled: !!gameId && !!hostToken,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/games/${gameId}/bottles`, undefined, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return response.json();
    },
  });
  
  const [wines, setWines] = useState<Wine[]>([]);
  const [rounds, setRounds] = useState<Wine[][]>([]);

  // Update wines state when bottles data changes
  useEffect(() => {
    if (bottlesData?.bottles && gameData?.game) {
      console.log("Setting up", gameData.game.totalRounds, "rounds with", bottlesData.bottles.length, "bottles");
      
      const wineData: Wine[] = bottlesData.bottles.map((bottle: any, index: number) => ({
        id: bottle.id,
        labelName: bottle.labelName,
        funName: bottle.funName,
        price: bottle.price / 100, // Convert cents back to dollars for display
        originalIndex: index
      }));
      
      setWines(wineData);
      
      // Initialize rounds based on existing assignments
      const newRounds: Wine[][] = Array(gameData.game.totalRounds).fill(null).map(() => []);
      
      // Organize wines into rounds based on their roundIndex
      wineData.forEach(wine => {
        const bottle = bottlesData.bottles.find((b: any) => b.id === wine.id);
        if (bottle && bottle.roundIndex !== null && bottle.roundIndex >= 0) {
          if (newRounds[bottle.roundIndex]) {
            newRounds[bottle.roundIndex].push(wine);
          }
        }
      });
      
      setRounds(newRounds);
    }
  }, [bottlesData, gameData]);

  // Calculate unassigned wines
  const assignedWineIds = new Set(rounds.flat().map(w => w.id));
  const unassignedWines = wines.filter(w => !assignedWineIds.has(w.id));

  // Auto assign functionality
  const [hasAutoAssigned, setHasAutoAssigned] = useState(false);
  const [hasBeenReset, setHasBeenReset] = useState(false);

  const handleAutoAssign = () => {
    if (unassignedWines.length === 0) return;
    
    // Shuffle unassigned wines
    const shuffled = [...unassignedWines].sort(() => Math.random() - 0.5);
    const newRounds = [...rounds];
    
    // Distribute wines evenly across rounds
    let wineIndex = 0;
    for (let roundIndex = 0; roundIndex < newRounds.length; roundIndex++) {
      const remainingSlots = (gameData?.game?.bottlesPerRound || 4) - newRounds[roundIndex].length;
      for (let i = 0; i < remainingSlots && wineIndex < shuffled.length; i++) {
        newRounds[roundIndex].push(shuffled[wineIndex]);
        wineIndex++;
      }
    }
    
    setRounds(newRounds);
    setHasAutoAssigned(true);
  };

  const handleReset = () => {
    console.log("Reset button clicked - clearing all rounds");
    // Clear all rounds to move wines back to unassigned
    const totalRounds = gameData?.game?.totalRounds || 5;
    const emptyRounds = Array(totalRounds).fill(0).map(() => []);
    console.log("Setting rounds to empty:", emptyRounds);
    setRounds(emptyRounds);
    setHasAutoAssigned(false);
    setHasBeenReset(true);
  };

  const handleMixEmUp = () => {
    const allAssignedWines = rounds.flat();
    if (allAssignedWines.length === 0) return;
    
    // Shuffle assigned wines
    const shuffled = [...allAssignedWines].sort(() => Math.random() - 0.5);
    const newRounds = Array(gameData?.game?.totalRounds || 5).fill(null).map(() => []);
    
    // Redistribute shuffled wines
    let wineIndex = 0;
    for (let roundIndex = 0; roundIndex < newRounds.length; roundIndex++) {
      const bottlesPerRound = gameData?.game?.bottlesPerRound || 4;
      for (let i = 0; i < bottlesPerRound && wineIndex < shuffled.length; i++) {
        newRounds[roundIndex].push(shuffled[wineIndex]);
        wineIndex++;
      }
    }
    
    setRounds(newRounds);
  };

  // Auto assign on first load when all wines are unassigned (but not after manual reset)
  useEffect(() => {
    if (wines.length > 0 && !hasAutoAssigned && !hasBeenReset && unassignedWines.length === wines.length) {
      handleAutoAssign();
    }
  }, [wines.length, hasAutoAssigned, hasBeenReset, unassignedWines.length]);

  // Mutation to save bottle assignments
  const updateBottlesMutation = useMutation({
    mutationFn: async (roundData: { roundIndex: number; bottleIds: string[] }[]) => {
      const result = await apiRequest(
        "POST",
        `/api/games/${gameId}/bottles/organize`,
        { rounds: roundData },
        {
          headers: {
            "Authorization": `Bearer ${hostToken}`
          }
        }
      );
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

  // Auto-save functionality
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const totalAssigned = rounds.reduce((sum, round) => sum + round.length, 0);
      if (totalAssigned > 0 && gameData?.game?.id) {
        // Auto-save current state
        const roundData = rounds.map((roundWines, roundIndex) => ({
          roundIndex,
          bottleIds: roundWines.map(w => w.id)
        }));
        
        // Silent save (no toast notifications for auto-save)
        fetch(`/api/games/${gameData.game.id}/bottles/organize`, {
          method: "POST",
          body: JSON.stringify({ rounds: roundData }),
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${hostToken}`
          }
        }).catch(() => {
          // Silent failure for auto-save
        });
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimeout);
  }, [rounds, gameData?.game?.id, hostToken]);

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
    // Validate organization before saving
    const errors = [];
    
    // Check that all bottles are assigned
    const totalAssigned = rounds.reduce((sum, round) => sum + round.length, 0);
    if (totalAssigned !== wines.length) {
      errors.push(`All ${wines.length} bottles must be assigned to rounds (${totalAssigned} currently assigned)`);
    }
    
    // Check for correct bottles per round
    if (gameData?.game?.bottlesPerRound) {
      const expectedPerRound = gameData.game.bottlesPerRound;
      rounds.forEach((round, index) => {
        if (round.length !== expectedPerRound) {
          errors.push(`Round ${index + 1} has ${round.length} bottles, expected ${expectedPerRound}`);
        }
      });
    }
    
    // Check for duplicate assignments
    const allAssignedIds = new Set();
    const duplicates = [];
    rounds.forEach((round) => {
      round.forEach((wine) => {
        if (allAssignedIds.has(wine.id)) {
          duplicates.push(wine.labelName);
        }
        allAssignedIds.add(wine.id);
      });
    });
    
    if (duplicates.length > 0) {
      errors.push(`Bottles assigned to multiple rounds: ${duplicates.join(", ")}`);
    }
    
    if (errors.length > 0) {
      toast({
        title: "Organization Error",
        description: errors.join(". "),
        variant: "destructive",
      });
      return;
    }

    const roundData = rounds.map((roundWines, roundIndex) => ({
      roundIndex,
      bottleIds: roundWines.map(w => w.id)
    }));

    updateBottlesMutation.mutate(roundData);
  };

  const handleStartGame = async () => {
    try {
      await apiRequest(
        "POST",
        `/api/games/${gameId}/start`,
        undefined,
        {
          headers: {
            "Authorization": `Bearer ${hostToken}`
          }
        }
      );
      
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

  if (isLoading || bottlesLoading) return <div>Loading...</div>;
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
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/setup/${gameId}?hostToken=${hostToken}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Wine List
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Organize Wines into Rounds
          </h1>
          <p className="text-gray-600 text-center">
            Assign your {wines.length} wines to {game.totalRounds} rounds ({game.bottlesPerRound} wines per round)
          </p>
        </div>

        {/* Control buttons */}
        <div className="flex gap-3 mb-6 justify-center">
          <Button
            onClick={handleAutoAssign}
            disabled={unassignedWines.length === 0}
            variant="outline"
            size="sm"
          >
            🤖 Auto Assign
          </Button>
          
          <Button
            onClick={handleMixEmUp}
            disabled={rounds.flat().length === 0}
            variant="outline"
            size="sm"
          >
            🔀 Mix 'Em Up
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={rounds.flat().length === 0}
                variant="outline"
                size="sm"
              >
                🔄 Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Wine Organization</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all round assignments and move all wines back to the unassigned section. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Reset All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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