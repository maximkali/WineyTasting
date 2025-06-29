import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Badge } from "@/common/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/common/ui/dialog";
import { Checkbox } from "@/common/ui/checkbox";
import { ScrollArea } from "@/common/ui/scroll-area";
import { Plus, X, Shuffle, RotateCcw, Save } from "lucide-react";
import WineyHeader from "@/common/winey-header";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/common/lib/queryClient";
import { useToast } from "@/common/hooks/use-toast";
import { useGame } from "@/common/hooks/use-game";

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
        <div className="w-8 h-8 bg-wine text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
          {String.fromCharCode(65 + (wine.originalIndex ?? index))}
        </div>
        
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
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-wine">${wine.price.toFixed(2)}</span>
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
            variant={wines.length === bottlesPerRound ? "default" : "secondary"} 
            className="text-xs"
          >
            {wines.length}/{bottlesPerRound}
          </Badge>
          <span className="text-sm font-normal text-gray-600">
            Sum: ${totalCost.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {wines.map((wine, index) => (
          <WineTile
            key={wine.id}
            wine={wine}
            index={index}
            onRemove={() => onRemoveWine(round, wine.id)}
          />
        ))}
        
        {canAddMore && availableWines.length > 0 && (
          <WineSelectionModal
            availableWines={availableWines}
            onSelectWines={(wineIds) => onAddWines(round, wineIds)}
            maxSelections={maxNewSelections}
            roundNumber={round}
          />
        )}
        
        {!canAddMore && (
          <div className="text-center text-sm text-gray-500 py-4">
            Round is full
          </div>
        )}
        
        {canAddMore && availableWines.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-4">
            No wines available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Rounds() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get host token and temporary wines from session storage
  const hostToken = gameId ? sessionStorage.getItem(`game-${gameId}-hostToken`) : null;
  const tempWinesJson = gameId ? sessionStorage.getItem(`game-${gameId}-tempWines`) : null;
  
  // Game data
  const { data: gameData, isLoading, isError } = useGame(gameId!);
  
  // Parse temporary wines
  const [wines, setWines] = useState<Wine[]>([]);
  const [rounds, setRounds] = useState<Wine[][]>([]);
  const [hasAutoAssigned, setHasAutoAssigned] = useState(false);
  
  // Load wines from session storage on mount
  useEffect(() => {
    if (tempWinesJson && gameData?.game) {
      try {
        const parsedWines = JSON.parse(tempWinesJson);
        setWines(parsedWines);
        
        // Initialize empty rounds
        const totalRounds = gameData.game.totalRounds || 5;
        setRounds(Array(totalRounds).fill(null).map(() => []));
      } catch (error) {
        console.error('Error parsing temporary wines:', error);
        toast({
          title: "Error",
          description: "Failed to load wines. Please go back to Wine List.",
          variant: "destructive"
        });
      }
    }
  }, [tempWinesJson, gameData, toast]);

  // Calculate unassigned wines
  const assignedWineIds = new Set(rounds.flat().map(w => w.id));
  const unassignedWines = wines.filter(w => !assignedWineIds.has(w.id));

  // Save wines and rounds mutation
  const saveWinesAndRoundsMutation = useMutation({
    mutationFn: async () => {
      // First save the wines
      const bottles = wines.map((wine, index) => ({
        labelName: wine.labelName,
        funName: wine.funName || null,
        price: Math.round(wine.price * 100), // Convert to cents
        gameId: gameId!,
        originalIndex: index
      }));

      const bottlesResponse = await apiRequest('PUT', `/api/games/${gameId}/bottles`, { bottles }, {
        'Authorization': `Bearer ${hostToken}`
      });

      if (!bottlesResponse.ok) {
        throw new Error('Failed to save wines');
      }

      const bottlesData = await bottlesResponse.json();
      
      // Map temporary IDs to real database IDs
      const idMapping = new Map<string, string>();
      bottlesData.bottles.forEach((dbBottle: any, index: number) => {
        const tempWine = wines[index];
        if (tempWine) {
          idMapping.set(tempWine.id, dbBottle.id);
        }
      });

      // Then organize rounds with real IDs
      const roundData = rounds.map((round, roundIndex) => ({
        roundIndex,
        bottleIds: round.map(wine => idMapping.get(wine.id) || wine.id)
      }));

      const organizeResponse = await apiRequest('POST', `/api/games/${gameId}/bottles/organize`, { rounds: roundData }, {
        'Authorization': `Bearer ${hostToken}`
      });

      if (!organizeResponse.ok) {
        throw new Error('Failed to organize rounds');
      }

      return organizeResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/bottles`] });
      
      // Clear temporary wines from session storage
      sessionStorage.removeItem(`game-${gameId}-tempWines`);
      
      toast({
        title: "Success",
        description: "Wines and rounds saved successfully!"
      });
      
      // Navigate to lobby
      navigate(`/lobby/${gameId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save wines and rounds.",
        variant: "destructive"
      });
    }
  });

  // Auto assign functionality
  const handleAutoAssign = () => {
    if (unassignedWines.length === 0) return;
    
    const shuffled = [...unassignedWines].sort(() => Math.random() - 0.5);
    const newRounds = [...rounds];
    
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
    const totalRounds = gameData?.game?.totalRounds || 5;
    setRounds(Array(totalRounds).fill(0).map(() => []));
    setHasAutoAssigned(false);
  };

  const handleMixEmUp = () => {
    const allAssignedWines = rounds.flat();
    if (allAssignedWines.length === 0) return;
    
    const shuffled = [...allAssignedWines].sort(() => Math.random() - 0.5);
    const newRounds = Array(gameData?.game?.totalRounds || 5).fill(null).map(() => []);
    
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

  // Auto assign on first load
  useEffect(() => {
    if (wines.length > 0 && !hasAutoAssigned && unassignedWines.length === wines.length) {
      handleAutoAssign();
    }
  }, [wines.length, hasAutoAssigned, unassignedWines.length]);

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

  const handleSave = async () => {
    // Validate organization
    const totalAssigned = rounds.reduce((sum, round) => sum + round.length, 0);
    if (totalAssigned !== wines.length) {
      toast({
        title: "Error",
        description: `All ${wines.length} wines must be assigned to rounds (${totalAssigned} currently assigned)`,
        variant: "destructive"
      });
      return;
    }

    // Validate bottles per round
    if (gameData?.game?.bottlesPerRound) {
      const invalidRounds = rounds
        .map((round, index) => ({ round, index }))
        .filter(({ round }) => round.length !== gameData.game.bottlesPerRound);
      
      if (invalidRounds.length > 0) {
        const errors = invalidRounds.map(({ round, index }) => 
          `Round ${index + 1}: ${round.length} wines (expected ${gameData.game.bottlesPerRound})`
        );
        toast({
          title: "Error",
          description: errors.join(', '),
          variant: "destructive"
        });
        return;
      }
    }

    // Save wines and rounds
    await saveWinesAndRoundsMutation.mutateAsync();
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading game data</div>;
  if (!gameData) return <div>Game not found</div>;
  if (!tempWinesJson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WineyHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No wines found</h1>
          <p className="text-gray-600 mb-6">Please add wines in the Wine List page first.</p>
          <Button onClick={() => navigate(`/wine-list/${gameId}`)}>
            Go to Wine List
          </Button>
        </div>
      </div>
    );
  }

  const { game } = gameData;

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organize Wine Rounds</h1>
          <p className="text-gray-600">Drag and organize your {wines.length} wines into {game.totalRounds} rounds</p>
        </div>

        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            onClick={handleAutoAssign}
            disabled={unassignedWines.length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Auto-Assign ({unassignedWines.length} unassigned)
          </Button>
          <Button
            onClick={handleMixEmUp}
            disabled={rounds.flat().length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Mix 'Em Up
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </Button>
        </div>

        {/* Rounds grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {rounds.map((round, index) => (
            <RoundCard
              key={index}
              round={index}
              wines={round}
              bottlesPerRound={game.bottlesPerRound || 4}
              availableWines={unassignedWines}
              onAddWines={handleAddWinesToRound}
              onRemoveWine={handleRemoveWineFromRound}
            />
          ))}
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveWinesAndRoundsMutation.isPending}
            className="flex items-center gap-2"
          >
            {saveWinesAndRoundsMutation.isPending ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save & Continue
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}