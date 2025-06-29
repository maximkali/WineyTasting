import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Shuffle, Save, RotateCcw, Wine, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Badge } from "@/common/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/common/ui/dialog";
import { Checkbox } from "@/common/ui/checkbox";
import WineyHeader from "@/common/winey-header";
import { toast, useToast } from "@/common/hooks/use-toast";
import { queryClient, apiRequest } from "@/common/lib/queryClient";
import { useGame } from "@/common/hooks/use-game";
import { formatPrice } from "@/common/lib/game-utils";

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
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-wine-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
          {String.fromCharCode(65 + index)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{wine.funName || wine.labelName}</p>
          <p className="text-xs text-gray-500">{wine.labelName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{formatPrice(wine.price)}</span>
        {onRemove && (
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
}

function RoundCard({ round, wines, bottlesPerRound, availableWines, onAddWines, onRemoveWine }: RoundCardProps) {
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
            {wines.map((wine, index) => (
              <WineTile
                key={wine.id}
                wine={wine}
                index={index}
                onRemove={() => onRemoveWine(round, wine.id)}
              />
            ))}
          </div>
        )}
        
        {wines.length < bottlesPerRound && availableWines.length > 0 && (
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

  // Get host token from session storage
  const hostToken = gameId ? sessionStorage.getItem(`game-${gameId}-hostToken`) : null;
  
  // Game data
  const { data: gameData, isLoading: gameLoading, isError: gameError } = useGame(gameId!);
  
  // Bottles data - read directly from database
  const { data: bottlesData, isLoading: bottlesLoading } = useQuery({
    queryKey: [`/api/games/${gameId}/bottles`],
    enabled: !!gameId && !!hostToken,
  });
  
  // State for wines and rounds
  const [wines, setWines] = useState<Wine[]>([]);
  const [rounds, setRounds] = useState<Wine[][]>([]);
  const [hasAutoAssigned, setHasAutoAssigned] = useState(false);
  
  // Load wines from database on mount
  useEffect(() => {
    if (bottlesData?.bottles && gameData?.game) {
      const wineData = bottlesData.bottles.map((bottle: any, index: number) => ({
        id: bottle.id,
        labelName: bottle.labelName,
        funName: bottle.funName,
        price: bottle.price / 100, // Convert from cents
        originalIndex: index
      }));
      setWines(wineData);
      
      // Initialize empty rounds
      const totalRounds = gameData.game.totalRounds || 5;
      setRounds(Array(totalRounds).fill(null).map(() => []));
    }
  }, [bottlesData, gameData]);

  // Get unassigned wines
  const assignedWineIds = new Set(rounds.flat().map(w => w.id));
  const unassignedWines = wines.filter(w => !assignedWineIds.has(w.id));

  // Save rounds mutation - wines are already in database
  const saveRoundsMutation = useMutation({
    mutationFn: async () => {
      if (!gameId || !hostToken) throw new Error('Missing game ID or host token');
      
      // Map round assignments using existing bottle IDs
      const roundData = rounds.map((roundWines, roundIndex) => ({
        roundIndex,
        bottleIds: roundWines.map(wine => wine.id)
      }));
      
      console.log('[DEBUG] Saving rounds data:', roundData);
      
      // Organize rounds with bottle IDs
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
    setHasAutoAssigned(true);
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
    setHasAutoAssigned(false);
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
    const incompleteRounds = rounds.filter((r, idx) => r.length !== bottlesPerRound);
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
          <p className="text-gray-600 text-sm">Assign your {wines.length} wines to {game.totalRounds} rounds ({game.bottlesPerRound} wines per round)</p>
        </div>

        {/* Action buttons */}
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

        {/* Rounds grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {rounds.map((round, index) => (
            <RoundCard
              key={index}
              round={index}
              wines={round}
              bottlesPerRound={game.bottlesPerRound || 4}
              availableWines={unassignedWines}
              onAddWines={handleAddWines}
              onRemoveWine={handleRemoveWine}
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
                    <div className="w-8 h-8 bg-wine-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                      {String.fromCharCode(65 + (wine.originalIndex || wines.findIndex(w => w.id === wine.id)))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {wine.funName || wine.labelName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{wine.labelName}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatPrice(wine.price)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
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
                <Save className="h-4 w-4 mr-2" />
                Save and Continue
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}