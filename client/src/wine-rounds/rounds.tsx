import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Shuffle, Save, RotateCcw, Wine, ChevronRight } from "lucide-react";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Badge } from "@/common/ui/badge";
import WineyHeader from "@/common/winey-header";
import { toast, useToast } from "@/common/hooks/use-toast";
import { queryClient, apiRequest } from "@/common/lib/queryClient";
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
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-wine-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
          {index + 1}
        </div>
        <div>
          <p className="font-medium text-gray-900">{wine.funName || wine.labelName}</p>
          <p className="text-sm text-gray-500">{wine.labelName}</p>
        </div>
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600"
        >
          Remove
        </Button>
      )}
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
  return (
    <Card className={wines.length === bottlesPerRound ? "border-green-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Round {round + 1}</span>
          <Badge variant={wines.length === bottlesPerRound ? "default" : "secondary"}>
            {wines.length}/{bottlesPerRound}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {wines.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No wines assigned yet</p>
        ) : (
          <div className="space-y-2">
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
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Simple selection - just add the first available wine
                const wineToAdd = availableWines[0];
                if (wineToAdd) {
                  onAddWines(round, [wineToAdd.id]);
                }
              }}
            >
              Add Wine
            </Button>
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

  // Get unassigned wines
  const assignedWineIds = new Set(rounds.flat().map(w => w.id));
  const unassignedWines = wines.filter(w => !assignedWineIds.has(w.id));

  // Save wines and rounds mutation
  const saveWinesAndRoundsMutation = useMutation({
    mutationFn: async () => {
      if (!gameId || !hostToken) throw new Error('Missing game ID or host token');
      
      // First save wines
      const winesData = wines.map((wine, index) => ({
        labelName: wine.labelName,
        funName: wine.funName || undefined,
        price: Math.round(wine.price * 100) // Convert to cents
      }));
      
      const winesResponse = await apiRequest('POST', `/api/games/${gameId}/bottles`, winesData, {
        'Authorization': `Bearer ${hostToken}`
      });
      
      if (!winesResponse.ok) {
        throw new Error('Failed to save wines');
      }
      
      const savedBottles = await winesResponse.json();
      
      // Map saved bottle IDs to round assignments
      const roundData = rounds.map((roundWines, roundIndex) => ({
        roundIndex,
        bottleIds: roundWines.map(wine => {
          const savedBottle = savedBottles.bottles.find((b: any) => 
            b.labelName === wine.labelName && b.funName === wine.funName
          );
          return savedBottle?.id;
        }).filter(Boolean)
      }));
      
      // Then organize rounds with real IDs
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
          <p className="text-gray-600">Organize your {wines.length} wines into {game.totalRounds} rounds</p>
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
              onAddWines={handleAddWines}
              onRemoveWine={handleRemoveWine}
            />
          ))}
        </div>

        {/* Unassigned wines */}
        {unassignedWines.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Unassigned Wines ({unassignedWines.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {unassignedWines.map((wine, index) => (
                  <div key={wine.id} className="bg-gray-100 p-2 rounded text-sm">
                    {wine.funName || wine.labelName}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={unassignedWines.length > 0 || saveWinesAndRoundsMutation.isPending}
            size="lg"
            className="min-w-[200px]"
          >
            {saveWinesAndRoundsMutation.isPending ? (
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