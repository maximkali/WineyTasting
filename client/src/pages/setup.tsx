import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Settings, Users, Wine, RotateCcw, Plus, ArrowLeft } from "lucide-react";
import WineyHeader from "@/components/winey-header";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";
import { 
  getUniquePlayerCounts, 
  getBottleOptionsForPlayers, 
  getRoundOptions,
  type GameSetupOption 
} from "@shared/game-setups";

export default function Setup() {
  const { gameId } = useParams();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  

  
  // Check for temporary game data first
  const tempGameData = gameId ? JSON.parse(sessionStorage.getItem(`tempGame_${gameId}`) || 'null') : null;
  const isTemporaryGame = tempGameData?.status === 'temp';
  
  // Use different tokens for temp vs real games
  const hostToken = isTemporaryGame 
    ? tempGameData?.hostToken 
    : sessionStorage.getItem(`game-${gameId}-hostToken`);
  
  // Only fetch from API if it's not a temporary game
  const { data: gameData, isLoading: gameLoading, error: gameError } = useQuery({
    queryKey: [`/api/games/${gameId}`],
    enabled: !isTemporaryGame && !!gameId && !!hostToken,
    refetchInterval: 5000,
  });

  // Fetch existing bottles for the game
  const { data: bottlesData, isLoading: bottlesLoading } = useQuery({
    queryKey: [`/api/games/${gameId}/bottles`],
    enabled: !!gameId && !!hostToken && !!gameData?.game,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/games/${gameId}/bottles`, undefined, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return response.json();
    },
  });
  
  // Game configuration state
  const [selectedPlayers, setSelectedPlayers] = useState<number | null>(null);
  const [selectedBottles, setSelectedBottles] = useState<number | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<GameSetupOption | null>(null);
  
  // Wine entry state
  const [bottles, setBottles] = useState<{ labelName: string; funName: string; price: string }[]>([]);
  const [configurationStep, setConfigurationStep] = useState<'config' | 'wines'>('config');

  // Get available options
  const playerOptions = getUniquePlayerCounts();
  const bottleOptions = selectedPlayers ? getBottleOptionsForPlayers(selectedPlayers) : [];
  const roundOptions = selectedPlayers && selectedBottles ? getRoundOptions(selectedPlayers, selectedBottles) : [];
  
  useEffect(() => {
    if (selectedPlayers && selectedBottles) {
      const options = getRoundOptions(selectedPlayers, selectedBottles);
      if (options.length > 0) {
        setSelectedConfig(options[0]); // Auto-select the option with most rounds
      } else {
        setSelectedConfig(null); // Clear selection if no options available
      }
    } else {
      setSelectedConfig(null); // Clear when players or bottles not selected
    }
  }, [selectedPlayers, selectedBottles]);

  useEffect(() => {
    if (selectedConfig && bottlesData?.bottles) {
      // Sync bottles state with database data
      const existingBottles = bottlesData.bottles.map((b: any) => ({
        labelName: b.labelName,
        funName: b.funName,
        price: (b.price / 100).toFixed(2) // Convert cents to dollars
      }));
      
      // If we need more bottles than we have, append empty ones
      const totalNeeded = selectedConfig.bottles;
      const currentCount = existingBottles.length;
      
      if (currentCount < totalNeeded) {
        const emptyBottles = Array.from({ length: totalNeeded - currentCount }, () => ({
          labelName: "",
          funName: "",
          price: ""
        }));
        setBottles([...existingBottles, ...emptyBottles]);
      } else {
        // If we have more or equal bottles, just use what we have
        setBottles(existingBottles);
      }
      
      console.log('[DEBUG] Synced bottles state:', existingBottles.length, 'existing +', totalNeeded - currentCount, 'new');
    } else if (selectedConfig && !bottlesData?.bottles) {
      // No existing bottles, create all new
      setBottles(Array.from({ length: selectedConfig.bottles }, () => ({
        labelName: "",
        funName: "",
        price: ""
      })));
    }
  }, [selectedConfig, bottlesData]);

  // Single effect to handle both loading data and query param navigation
  useEffect(() => {
    // Check for clear parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const shouldClear = urlParams.get('clear') === 'true';
    
    if (shouldClear) {
      // Clear bottles data but preserve configuration
      setBottles([]);
      setConfigurationStep('config');
      // Remove the clear parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('clear');
      window.history.replaceState({}, '', newUrl.toString());
      // Delete bottles from database
      if (gameId && hostToken) {
        apiRequest("DELETE", `/api/games/${gameId}/bottles`, undefined, {
          headers: { Authorization: `Bearer ${hostToken}` }
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/bottles`] });
        });
      }
      return;
    }
    
    if (gameData?.game && bottlesData?.bottles) {
      const game = gameData.game;
      
      // Set configuration from game data
      if (game.totalBottles && game.maxPlayers && game.totalRounds && game.bottlesPerRound) {

        
        const actualBottleCount = bottlesData.bottles.length || game.totalBottles;
        setSelectedPlayers(game.maxPlayers);
        setSelectedBottles(actualBottleCount);
        setSelectedConfig({
          players: game.maxPlayers,
          bottles: actualBottleCount,
          rounds: game.totalRounds,
          bottlesPerRound: game.bottlesPerRound,
          bottleEqPerPerson: game.bottleEqPerPerson || 0,
          ozPerPersonPerBottle: game.ozPerPersonPerBottle || 0
        });
        
        // Load existing bottles data
        if (bottlesData.bottles.length > 0) {

          const existingBottles = bottlesData.bottles.map((bottle: any) => ({
            labelName: bottle.labelName || "",
            funName: bottle.funName || "",
            price: (bottle.price / 100).toString() // Convert from cents back to dollars
          }));
          setBottles(existingBottles);
        }
        
        // Check query param to determine which step to show
        const stepParam = urlParams.get('step');
        
        if (stepParam === 'wines' || bottlesData.bottles.length > 0) {

          setConfigurationStep('wines');
        }
      }
    }
  }, [gameData, bottlesData, location, gameId, hostToken, queryClient]);

  // All hooks must be declared before any conditional returns
  const saveConfigMutation = useMutation({
    mutationFn: async (config: GameSetupOption) => {
      const configData = {
        maxPlayers: config.players,
        totalBottles: config.bottles,
        totalRounds: config.rounds,
        bottlesPerRound: config.bottlesPerRound,
        bottleEqPerPerson: config.bottleEqPerPerson,
        ozPerPersonPerBottle: config.ozPerPersonPerBottle,
      };
      const res = await apiRequest("POST", `/api/games/${gameId}/config`, configData, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      setConfigurationStep('wines');
      toast({
        title: "Configuration Saved",
        description: "Game configuration set successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addBottlesMutation = useMutation({
    mutationFn: async (newBottlesData?: any[]) => {
      // Use the passed data or current bottles state
      const bottlesToSave = newBottlesData || bottles.map(bottle => ({
        labelName: bottle.labelName.trim(),
        funName: bottle.funName.trim() || null,
        price: Math.round(parseFloat(bottle.price) * 100), // Convert to cents for storage
      }));
      
      // Check if bottles already exist in database to determine POST vs PUT
      const hasExistingBottles = bottlesData?.bottles && bottlesData.bottles.length > 0;
      const method = hasExistingBottles ? "PUT" : "POST";
      
      const res = await apiRequest(method, `/api/games/${gameId}/bottles`, {
        bottles: bottlesToSave,
      }, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/bottles`] });
      toast({
        title: "Success",
        description: "Wines saved successfully! Now organize them into rounds.",
      });
      setLocation(`/organize/${gameId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const randomizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/games/${gameId}/randomize`, {}, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({
        title: "Success",
        description: "Wines randomized into rounds!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Show loading while game data is being fetched
  // Handle loading for real games only
  if (!isTemporaryGame && (gameLoading || bottlesLoading)) {
    return (
      <div className="container max-w-2xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  // Handle missing host token
  if (!hostToken) {
    setLocation("/");
    return null;
  }

  // Handle real games - check for game data and status
  if (!isTemporaryGame) {
    if (!gameData?.game) {
      setLocation("/");
      return null;
    }
    
    if (gameData.game.status !== "setup") {
      setLocation(`/lobby/${gameId}`);
      return null;
    }
  }

  const updateBottle = (index: number, field: keyof typeof bottles[0], value: string) => {
    setBottles(prev => prev.map((bottle, i) => 
      i === index ? { ...bottle, [field]: value } : bottle
    ));
  };

  const removeBottle = (index: number) => {
    setBottles(prev => prev.filter((_, i) => i !== index));
  };

  const addBottle = () => {
    if (selectedConfig && bottles.length < selectedConfig.bottles) {
      setBottles(prev => [...prev, { labelName: "", funName: "", price: "" }]);
    }
  };

  const fillSampleWines = () => {
    if (!selectedConfig) return;
    
    const allSampleWines = [
      { labelName: "Château Margaux 2019", funName: "The Midnight Velvet", price: "450" },
      { labelName: "Dom Pérignon 2012", funName: "Bubble Trouble", price: "320" },
      { labelName: "Opus One 2018", funName: "The Golden Hour", price: "380" },
      { labelName: "Screaming Eagle 2020", funName: "Eagle's Flight", price: "550" },
      { labelName: "Château Le Pin 2017", funName: "Pin Drop Silence", price: "420" },
      { labelName: "Petrus 2016", funName: "The Crown Jewel", price: "480" },
      { labelName: "Château d'Yquem 2015", funName: "Liquid Gold", price: "360" },
      { labelName: "Romanée-Conti 2019", funName: "The Holy Grail", price: "650" },
      { labelName: "Harlan Estate 2018", funName: "Mountain Majesty", price: "390" },
      { labelName: "Krug Grande Cuvée", funName: "The Prestigious Pop", price: "280" },
      { labelName: "Caymus Cabernet 2020", funName: "Napa Night", price: "85" },
      { labelName: "Silver Oak Alexander Valley", funName: "Silver Lining", price: "95" },
      { labelName: "Kendall-Jackson Vintner's Reserve", funName: "The People's Choice", price: "25" },
      { labelName: "La Crema Pinot Noir", funName: "Coastal Breeze", price: "35" },
      { labelName: "Meiomi Pinot Noir", funName: "Three County Blend", price: "28" },
      { labelName: "Josh Cellars Cabernet", funName: "Everyday Excellence", price: "18" },
      { labelName: "Bogle Phantom", funName: "The Dark Knight", price: "22" },
      { labelName: "14 Hands Hot to Trot", funName: "Wild Stallion", price: "15" },
      { labelName: "Apothic Red", funName: "Mystery Blend", price: "12" },
      { labelName: "Charles Shaw Cabernet", funName: "Two Buck Chuck", price: "3" },
    ];
    
    // Take only the needed number of wines
    const sampleWines = allSampleWines.slice(0, selectedConfig.bottles);
    setBottles(sampleWines);
  };

  const handleConfigSave = () => {
    if (!selectedConfig) {
      toast({
        title: "Error",
        description: "Please select a game configuration.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if we need to save or just move forward
    const existingGame = gameData?.game;
    const configChanged = !existingGame?.totalBottles || 
                         existingGame.totalBottles !== selectedConfig.bottles ||
                         existingGame.maxPlayers !== selectedConfig.players ||
                         existingGame.totalRounds !== selectedConfig.rounds;
    
    if (configChanged) {
      saveConfigMutation.mutate(selectedConfig);
    } else {
      // Configuration hasn't changed, just move to wine entry
      setConfigurationStep('wines');
    }
  };

  const handleWineSubmit = () => {
    if (!selectedConfig) return;
    
    // Comprehensive validation
    const errors = [];
    
    // Check for missing required fields
    bottles.forEach((bottle, index) => {
      if (!bottle.labelName.trim()) {
        errors.push(`Wine ${String.fromCharCode(65 + index)}: Label name is required`);
      }
      if (!bottle.price.trim() || isNaN(parseFloat(bottle.price)) || parseFloat(bottle.price) <= 0) {
        errors.push(`Wine ${String.fromCharCode(65 + index)}: Valid price is required`);
      }
    });

    // Check for duplicate prices
    const prices = bottles.map(b => parseFloat(b.price)).filter(p => !isNaN(p) && p > 0);
    const uniquePrices = new Set(prices);
    if (uniquePrices.size !== prices.length) {
      errors.push("All wine prices must be unique");
    }

    // Check for duplicate label names (case insensitive)
    const labelNames = bottles.map(b => b.labelName.trim().toLowerCase()).filter(n => n.length > 0);
    const uniqueLabels = new Set(labelNames);
    if (uniqueLabels.size !== labelNames.length) {
      errors.push("All wine label names must be unique");
    }

    // Check correct number of bottles
    if (bottles.length !== selectedConfig.bottles) {
      errors.push(`Expected ${selectedConfig.bottles} bottles, but found ${bottles.length}`);
    }

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(". "),
        variant: "destructive",
      });
      return;
    }

    const bottlesData = bottles.map(bottle => ({
      labelName: bottle.labelName.trim(),
      funName: bottle.funName.trim() || null,
      price: Math.round(parseFloat(bottle.price) * 100), // Convert to cents for storage
    }));

    addBottlesMutation.mutate(bottlesData);
  };

  const resetConfiguration = () => {
    setConfigurationStep('config');
    // Don't clear the data when going back - preserve existing entries
  };


  
  if (configurationStep === 'config') {
    return (
      <div className="min-h-screen bg-gray-50">
        <WineyHeader />
        <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Setup</h1>
          <p className="text-muted-foreground">Choose the player, bottle, and round counts below, then click Next. On the next screen enter each wine’s label name, blind nickname, and price. After that you’ll assign the wines to their rounds. You can edit or reorder anything until you press Start.</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Players Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium uppercase text-muted-foreground">
                Number of Players:
              </Label>
              <Select value={selectedPlayers?.toString()} onValueChange={(value) => {
                setSelectedPlayers(parseInt(value));
                setSelectedBottles(null);
                setSelectedConfig(null);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select players" />
                </SelectTrigger>
                <SelectContent>
                  {playerOptions.map(count => (
                    <SelectItem key={count} value={count.toString()}>
                      {count}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bottles Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium uppercase text-muted-foreground">
                Number of Bottles:
              </Label>
              <Select 
                value={selectedBottles?.toString()} 
                onValueChange={(value) => {
                  setSelectedBottles(parseInt(value));
                }}
                disabled={!selectedPlayers}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select bottles" />
                </SelectTrigger>
                <SelectContent>
                  {bottleOptions.map(option => (
                    <SelectItem key={option.bottles} value={option.bottles.toString()}>
                      {option.bottles}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rounds Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium uppercase text-muted-foreground">
                Number of Rounds:
              </Label>
              <Select 
                value={selectedConfig?.rounds.toString()} 
                onValueChange={(value) => {
                  const rounds = parseInt(value);
                  const options = getRoundOptions(selectedPlayers!, selectedBottles!);
                  const matchingConfig = options.find(opt => opt.rounds === rounds);
                  if (matchingConfig) {
                    setSelectedConfig(matchingConfig);
                  }
                }}
                disabled={!selectedPlayers || !selectedBottles}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select rounds" />
                </SelectTrigger>
                <SelectContent>
                  {roundOptions.map(option => (
                    <SelectItem key={option.rounds} value={option.rounds.toString()}>
                      {option.rounds}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tasting Details */}
            {selectedConfig && (
              <div className="space-y-4 pt-4 border-t">
                <h2 className="text-lg font-semibold">Tasting Details</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border rounded-lg p-4 text-center">
                    <div className="text-sm font-medium uppercase text-muted-foreground mb-2">
                      Tastings per Round:
                    </div>
                    <div className="text-2xl font-bold text-wine">{selectedConfig.bottlesPerRound} wines</div>
                  </div>
                  <div className="bg-white border rounded-lg p-4 text-center">
                    <div className="text-sm font-medium uppercase text-muted-foreground mb-2">
                      Max Pour per Tasting:
                    </div>
                    <div className="text-2xl font-bold text-wine">{selectedConfig.ozPerPersonPerBottle.toFixed(2)} oz</div>
                  </div>
                </div>



                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    In this tasting, you'll sample {selectedConfig.bottlesPerRound} different wines across {selectedConfig.rounds} rounds – {selectedConfig.bottles} wines total. For each wine, pour up to {selectedConfig.ozPerPersonPerBottle} oz. That adds up to {(selectedConfig.bottles * selectedConfig.ozPerPersonPerBottle).toFixed(2)} oz per person over the full game (roughly {Math.round((selectedConfig.bottles * selectedConfig.ozPerPersonPerBottle / 25.36) * 100)}% of a standard 750ml bottle). After each round, write down quick notes on aroma, flavor, and finish. Then, rank the {selectedConfig.bottlesPerRound} wines from most to least expensive based on what you think they're worth. Once everyone submits their rankings, the game shows the correct price order – without revealing labels or actual prices – and updates the live leaderboard. You get one point for each wine you place correctly. The player with the highest total score wins.
                  </p>
                </div>
                
                <Button 
                  onClick={handleConfigSave} 
                  disabled={saveConfigMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {saveConfigMutation.isPending ? "Creating..." : "Next"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // Wine entry step
  const canRandomize = selectedConfig && gameData.bottleCount === selectedConfig.bottles;

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetConfiguration}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Setup
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wine className="h-5 w-5" />
            <CardTitle>Wine List</CardTitle>
          </div>
          {selectedConfig && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">{selectedConfig.players} players</Badge>
              <Badge variant="secondary">{selectedConfig.bottles} bottles</Badge>
              <Badge variant="secondary">{selectedConfig.rounds} rounds</Badge>
              <Badge variant="secondary">{selectedConfig.ozPerPersonPerBottle} oz pours</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button onClick={fillSampleWines} variant="outline" className="flex-1">
              Fill Sample Wines
            </Button>
            <Button 
              onClick={addBottle} 
              disabled={!selectedConfig || bottles.length >= selectedConfig.bottles} 
              className="flex-1"
            >
              Add Another Bottle
            </Button>
          </div>

          <div className="space-y-3">
            {bottles.map((bottle, index) => (
              <div key={index} className="flex gap-3 items-center p-4 border rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1">
                  <Label htmlFor={`label-${index}`}>Label (Blinded)</Label>
                  <Input
                    id={`label-${index}`}
                    value={bottle.labelName}
                    onChange={(e) => updateBottle(index, "labelName", e.target.value)}
                    placeholder="e.g., Château Margaux 2019"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`fun-${index}`}>Nickname</Label>
                  <Input
                    id={`fun-${index}`}
                    value={bottle.funName}
                    onChange={(e) => updateBottle(index, "funName", e.target.value)}
                    placeholder="e.g., The Midnight Velvet"
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor={`price-${index}`}>Price ($)</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    value={bottle.price}
                    onChange={(e) => updateBottle(index, "price", e.target.value)}
                    placeholder="450"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeBottle(index)}
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleWineSubmit} 
              disabled={addBottlesMutation.isPending}
              className="flex-1"
            >
              {addBottlesMutation.isPending ? "Adding..." : "🔒 Lock the Lineup 🔒"}
            </Button>
            
            {canRandomize && (
              <>
                <Button 
                  onClick={handleWineSubmit}
                  variant="outline"
                  className="flex-1"
                >
                  Organize Wines
                </Button>
                
                <Button 
                  onClick={() => randomizeMutation.mutate()}
                  disabled={randomizeMutation.isPending}
                  className="flex-1"
                >
                  {randomizeMutation.isPending ? "Randomizing..." : `Auto-Assign to ${selectedConfig?.rounds} Rounds`}
                </Button>
              </>
            )}
          </div>

          {!canRandomize && selectedConfig && bottles.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Once you've added all your wines, we'll organize them into {selectedConfig.rounds} tasting rounds for you.
              </p>
            </div>
          )}

          {canRandomize && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Ready to start! Click "Randomize into {selectedConfig?.rounds} Rounds" to generate your game link.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}