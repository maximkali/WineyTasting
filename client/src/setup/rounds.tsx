import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shuffle, RotateCcw, Plus, X } from "lucide-react";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Badge } from "@/common/ui/badge";
import { useToast } from "@/common/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/common/ui/dialog";
import { Checkbox } from "@/common/ui/checkbox";
import WineyHeader from "@/common/winey-header";
import { apiRequest } from "@/common/lib/queryClient";
import { formatPrice } from "@/common/lib/game-utils";

// Type definitions
interface Bottle {
  id: string;
  labelName: string;
  funName: string | null;
  price: number;
}

interface GameData {
  id: string;
  maxPlayers: number;
  totalBottles: number;
  totalRounds: number;
  bottlesPerRound: number;
  bottleEqPerPerson: number;
  ozPerPersonPerBottle: number;
  roundsLocked?: boolean;
  hostToken?: string;
}

interface GameResponse {
  game: GameData;
}

interface BottlesResponse {
  bottles: Bottle[];
}

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
  disabled?: boolean;
}

function WineTile({ wine, index, onRemove, disabled = false }: WineTileProps) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-semibold">
          {String.fromCharCode(65 + index)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{wine.labelName}</p>
          {wine.funName && <p className="text-xs text-gray-500">"{wine.funName}"</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{formatPrice(wine.price)}</span>
        {onRemove && !disabled && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface RoundCardProps {
  round: number;
  wines: Wine[];
  bottlesPerRound: number;
  availableWines: Wine[];
  onAddWines: (roundIndex: number, wineIds: string[]) => void;
  onRemoveWine: (roundIndex: number, wineId: string) => void;
  disabled?: boolean;
}

function RoundCard({ round, wines, bottlesPerRound, availableWines, onAddWines, onRemoveWine, disabled = false }: RoundCardProps) {
  const [selectedWines, setSelectedWines] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleWineToggle = (wineId: string) => {
    setSelectedWines(prev => 
      prev.includes(wineId) 
        ? prev.filter(id => id !== wineId)
        : [...prev, wineId]
    );
  };

  const handleAddSelectedWines = () => {
    if (selectedWines.length > 0) {
      onAddWines(round, selectedWines);
      setSelectedWines([]);
      setIsDialogOpen(false);
    }
  };

  const remainingSlots = bottlesPerRound - wines.length;

  return (
    <Card className={wines.length === bottlesPerRound ? "border-green-500" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-base font-medium">Round {round + 1}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Sum: {formatPrice(wines.reduce((sum, wine) => sum + wine.price, 0))}
            </span>
            <Badge 
              variant={wines.length === bottlesPerRound ? "default" : "secondary"}
              className={wines.length === bottlesPerRound 
                ? "bg-green-500 text-white" 
                : "bg-gray-100 text-gray-600"
              }
            >
              {wines.length}/{bottlesPerRound}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {wines.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No wines assigned yet</p>
        ) : (
          <div className="space-y-1">
            {wines.map((wine) => (
              <WineTile
                key={wine.id}
                wine={wine}
                index={wine.originalIndex !== undefined ? wine.originalIndex : wines.findIndex(w => w.id === wine.id)}
                onRemove={() => onRemoveWine(round, wine.id)}
                disabled={disabled}
              />
            ))}
          </div>
        )}
        
        {wines.length < bottlesPerRound && availableWines.length > 0 && !disabled && (
          <div className="mt-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-700">
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Add Wines</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Wines to Round {round + 1}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Select up to {remainingSlots} wine{remainingSlots !== 1 ? 's' : ''} to add to this round:
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableWines.map((wine) => (
                      <div key={wine.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={`wine-${wine.id}`}
                          checked={selectedWines.includes(wine.id)}
                          onCheckedChange={() => handleWineToggle(wine.id)}
                          disabled={!selectedWines.includes(wine.id) && selectedWines.length >= remainingSlots}
                        />
                        <label htmlFor={`wine-${wine.id}`} className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium">{wine.funName || wine.labelName}</p>
                            <p className="text-sm text-gray-500">{wine.labelName}</p>
                            <p className="text-sm text-gray-400">${wine.price}</p>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      {selectedWines.length} selected
                    </p>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedWines([]);
                          setIsDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddSelectedWines}
                        disabled={selectedWines.length === 0}
                      >
                        Add {selectedWines.length} Wine{selectedWines.length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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

  // State for wines and rounds
  const [wines, setWines] = useState<Wine[]>([]);
  const [rounds, setRounds] = useState<Wine[][]>([]);

  // Game data
  const { data: gameData, isLoading: gameLoading, error: gameError } = useQuery<GameResponse>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });
  
  // Bottles data
  const { data: bottlesData, isLoading: bottlesLoading } = useQuery<BottlesResponse>({
    queryKey: [`/api/games/${gameId}/bottles`],
    enabled: !!gameId,
  });
  
  // Host token is no longer used in this component
  // Initialize wines and rounds when data loads
  useEffect(() => {
    if (bottlesData?.bottles && gameData?.game) {
      const wineData: Wine[] = bottlesData.bottles.map((bottle: Bottle, index: number) => ({
        id: bottle.id,
        labelName: bottle.labelName,
        funName: bottle.funName,
        price: bottle.price / 100, // Convert from cents to dollars
        originalIndex: index
      }));
      
      setWines(wineData);
      
      // Initialize rounds - check if bottles already have round assignments
      const totalRounds = gameData.game.totalRounds || 5;
      const initialRounds: Wine[][] = Array(totalRounds).fill(null).map(() => []);
      
      // Populate rounds with existing assignments
      bottlesData.bottles.forEach((bottle: Bottle & { roundIndex?: number }) => {
        if (bottle.roundIndex !== undefined && 
            bottle.roundIndex !== null && 
            bottle.roundIndex >= 0 && 
            bottle.roundIndex < totalRounds) {
          const wine = wineData.find(w => w.id === bottle.id);
          if (wine) {
            initialRounds[bottle.roundIndex].push(wine);
          }
        }
      });
      
      setRounds(initialRounds);
    }
  }, [bottlesData, gameData]);

  // Check if rounds are locked
  const roundsLocked = gameData?.game?.roundsLocked || false;

  // Get unassigned wines
  const assignedWineIds = new Set(rounds.flat().map(w => w.id));
  const unassignedWines = wines.filter(w => !assignedWineIds.has(w.id));

  // Debug logging for session storage
  useEffect(() => {
    console.log('[DEBUG] Rounds - Game ID:', gameId);
    console.log('[DEBUG] Rounds - Player ID from session:', sessionStorage.getItem(`game-${gameId}-playerId`));
    console.log('[DEBUG] Rounds - Host Token from session:', sessionStorage.getItem(`game-${gameId}-hostToken`));
  }, [gameId]);

  // Save rounds mutation - wines are already in database
  const saveRoundsMutation = useMutation({
    mutationFn: async () => {
      if (!gameId) throw new Error('Missing game ID');
      
      // Map round assignments using existing bottle IDs
      const roundData = rounds.map((roundWines, roundIndex) => ({
        roundIndex,
        bottleIds: roundWines.map(wine => wine?.id).filter(Boolean) as string[]
      }));
      
      console.log('[DEBUG] Saving rounds data:', roundData);
      
      // Make the API call to organize the bottles into rounds
      const response = await apiRequest('POST', `/api/games/${gameId}/bottles/organize`, { 
        rounds: roundData 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[DEBUG] Failed to organize bottles:', errorData);
        throw new Error(errorData.error || 'Failed to organize bottles');
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('[DEBUG] Rounds saved successfully:', data);
      
      // Update the game data in the query cache with the response from the server
      if (data.game) {
        queryClient.setQueryData([`/api/games/${gameId}`], data.game);
      }
      
      // Invalidate queries to ensure fresh data is fetched
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/bottles`] })
      ]);
      
      // Check if we have the required session data
      const hostToken = sessionStorage.getItem(`game-${gameId}-hostToken`);
      const playerId = sessionStorage.getItem(`game-${gameId}-playerId`);
      
      console.log('[DEBUG] Session data before navigation:', { 
        hostToken: !!hostToken, 
        playerId,
        isHost: !!hostToken // If hostToken exists, this is the host
      });
      
      toast({
        title: "Success",
        description: "Wines and rounds saved successfully!"
      });
      
      // Navigate to the lobby with host status in the URL
      navigate(`/lobby/${gameId}?host=${!!hostToken}`);
    },
    onError: (error: any) => {
      console.error('[DEBUG] Error saving rounds:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save wines and rounds.",
        variant: "destructive"
      });
    }
  });

  const handleAddWines = (roundIndex: number, wineIds: string[]) => {
    const newRounds = [...rounds];
    const winesToAdd = wines.filter(w => wineIds.includes(w.id));
    newRounds[roundIndex] = [...newRounds[roundIndex], ...winesToAdd];
    setRounds(newRounds);
  };

  const handleRemoveWine = (roundIndex: number, wineId: string) => {
    const newRounds = [...rounds];
    newRounds[roundIndex] = newRounds[roundIndex].filter(w => w.id !== wineId);
    setRounds(newRounds);
  };

  const handleAutoAssign = () => {
    const newRounds = [...rounds];
    const bottlesPerRound = gameData?.game?.bottlesPerRound || 4;
    
    // Get all unassigned wines
    const assignedIds = new Set(newRounds.flat().map(w => w.id));
    const unassignedList = wines.filter(w => !assignedIds.has(w.id));
    
    // Shuffle unassigned wines
    const shuffled = [...unassignedList].sort(() => Math.random() - 0.5);
    
    // Assign to rounds that need wines
    let wineIndex = 0;
    for (let i = 0; i < newRounds.length && wineIndex < shuffled.length; i++) {
      const spotsNeeded = bottlesPerRound - newRounds[i].length;
      for (let j = 0; j < spotsNeeded && wineIndex < shuffled.length; j++) {
        newRounds[i].push(shuffled[wineIndex]);
        wineIndex++;
      }
    }
    
    setRounds(newRounds);
    toast({
      title: "Auto-assigned wines",
      description: `Assigned ${wineIndex} wines to rounds.`
    });
  };

  const handleMixEmUp = () => {
    // Collect all wines from all rounds
    const allWines = rounds.flat();
    
    // Shuffle them
    const shuffled = [...allWines].sort(() => Math.random() - 0.5);
    
    // Redistribute
    const bottlesPerRound = gameData?.game?.bottlesPerRound || 4;
    const newRounds: Wine[][] = Array(rounds.length).fill(null).map(() => []);
    
    shuffled.forEach((wine, index) => {
      const roundIndex = Math.floor(index / bottlesPerRound);
      if (roundIndex < newRounds.length) {
        newRounds[roundIndex].push(wine);
      }
    });
    
    setRounds(newRounds);
    toast({
      title: "Mixed up wines",
      description: "All wines have been randomly redistributed."
    });
  };

  const handleReset = () => {
    setRounds(Array(rounds.length).fill(null).map(() => []));
    toast({
      title: "Reset rounds",
      description: "All wines have been removed from rounds."
    });
  };

  const handleSave = async () => {
    const bottlesPerRound = gameData?.game?.bottlesPerRound || 4;
    const totalAssigned = rounds.reduce((sum, round) => sum + round.length, 0);
    
    // Validation
    if (totalAssigned !== wines.length) {
      toast({
        title: "Warning",
        description: `You have ${unassignedWines.length} unassigned wines. All wines must be assigned to rounds.`,
        variant: "destructive"
      });
      return;
    }
    
    // Check if each round has the correct number
    const incompleteRounds = rounds.filter(r => r.length !== bottlesPerRound);
    if (incompleteRounds.length > 0) {
      toast({
        title: "Warning",
        description: `Some rounds don't have exactly ${bottlesPerRound} wines.`,
        variant: "destructive"
      });
      return;
    }
    
    // Save rounds
    await saveRoundsMutation.mutateAsync();
  };

  if (gameLoading || bottlesLoading) return <div>Loading...</div>;
  if (gameError) return <div>Error loading game data</div>;
  if (!gameData) return <div>Game not found</div>;
  if (!bottlesData || bottlesData.bottles.length === 0) {
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
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Organize Wines into Rounds</h1>
          <p className="text-gray-600 text-sm">
            Assign your {wines.length} wines to {game?.totalRounds || 'N'} rounds 
            ({game?.bottlesPerRound || 'X'} wines per round)
          </p>
        </div>

        {/* Action buttons */}
        {!roundsLocked && (
          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            <Button
              onClick={handleAutoAssign}
              disabled={unassignedWines.length === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Auto-Assign
            </Button>
            <Button
              onClick={handleMixEmUp}
              disabled={rounds.flat().length === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Mix 'Em Up
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        )}
        
        {roundsLocked && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
            <p className="text-green-800 font-medium">✅ Rounds Finalized</p>
            <p className="text-sm text-green-600 mt-1">Your wine rounds have been organized and locked. Ready to start the game!</p>
          </div>
        )}

        {/* Rounds grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {rounds.map((round, index) => (
            <RoundCard
              key={index}
              round={index}
              wines={round}
              bottlesPerRound={game?.bottlesPerRound || 4}
              availableWines={unassignedWines}
              onAddWines={handleAddWines}
              onRemoveWine={handleRemoveWine}
              disabled={roundsLocked}
            />
          ))}
        </div>

        {/* Unassigned wines */}
        {unassignedWines.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Unassigned Wines ({unassignedWines.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {unassignedWines.map((wine) => (
                <Card key={wine.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                      {String.fromCharCode(65 + (wine.originalIndex !== undefined ? wine.originalIndex : wines.findIndex(w => w.id === wine.id)))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {wine.labelName}
                      </p>
                      {wine.funName && <p className="text-xs text-gray-500 truncate">"{wine.funName}"</p>}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatPrice(wine.price)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Save button */}
        {!roundsLocked && (
          <div className="flex justify-center">
            <Button
              onClick={handleSave}
              disabled={unassignedWines.length > 0 || saveRoundsMutation.isPending}
              size="lg"
              className="min-w-[200px]"
            >
              {saveRoundsMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  💾 Save & Continue
                </>
              )}
            </Button>
          </div>
        )}
        
        {roundsLocked && (
          <div className="flex justify-center">
            <Button
              onClick={() => navigate(`/lobby/${gameId}`)}
              size="lg"
              className="min-w-[200px]"
            >
              Proceed to Game Lobby →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}