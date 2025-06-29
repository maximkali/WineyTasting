import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Badge } from "@/common/ui/badge";
import { Separator } from "@/common/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/ui/select";
import { Trash2, Settings, Users, Wine, RotateCcw, Plus } from "lucide-react";
import WineyHeader from "@/common/winey-header";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/common/lib/queryClient";
import { useToast } from "@/common/hooks/use-toast";
import { useGame } from "@/common/hooks/use-game";
import { 
  getUniquePlayerCounts, 
  getBottleOptionsForPlayers, 
  getRoundOptions,
  type GameSetupOption 
} from "@shared/game-setups";

export default function Setup() {
  const { gameId } = useParams();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if this is a new game flow (no gameId) or existing game
  const isNewGame = !gameId;
  
  // Simple host token retrieval
  const hostToken = gameId ? sessionStorage.getItem(`game-${gameId}-hostToken`) : null;
  
  // Only fetch from API if not a new game
  const { data: gameData, isLoading: gameLoading, error: gameError } = useQuery({
    queryKey: [`/api/games/${gameId}`],
    enabled: !isNewGame && !!gameId && !!hostToken,
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
    if (selectedConfig) {
      // Initialize wine bottles array based on selected configuration
      setBottles(Array.from({ length: selectedConfig.bottles }, () => ({
        labelName: "",
        funName: "",
        price: ""
      })));
    }
  }, [selectedConfig]);

  // Effect to load existing bottles and configuration
  useEffect(() => {
    console.log('[DEBUG] Setup page loading - gameData:', gameData, 'bottlesData:', bottlesData);
    
    if (gameData?.game && bottlesData?.bottles) {
      const game = gameData.game;
      
      // Set configuration from game data
      if (game.totalBottles && game.maxPlayers && game.totalRounds && game.bottlesPerRound) {
        console.log('[DEBUG] Loading game config:', { 
          players: game.maxPlayers, 
          bottles: game.totalBottles,
          bottlesCount: bottlesData.bottles.length 
        });
        
        setSelectedPlayers(game.maxPlayers);
        setSelectedBottles(game.totalBottles);
        setSelectedConfig({
          players: game.maxPlayers,
          bottles: game.totalBottles,
          rounds: game.totalRounds,
          bottlesPerRound: game.bottlesPerRound,
          bottleEqPerPerson: game.bottleEqPerPerson || 0,
          ozPerPersonPerBottle: game.ozPerPersonPerBottle || 0
        });
        
        // Load existing bottles data
        if (bottlesData.bottles.length > 0) {
          console.log('[DEBUG] Loading existing bottles:', bottlesData.bottles.length);
          const existingBottles = bottlesData.bottles.map((bottle: any) => ({
            labelName: bottle.labelName || "",
            funName: bottle.funName || "",
            price: (bottle.price / 100).toString() // Convert from cents back to dollars
          }));
          setBottles(existingBottles);
          // Always show wine entry form when bottles exist
          setConfigurationStep('wines');
        }
      }
    }
  }, [gameData, bottlesData]);

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
      
      if (isNewGame) {
        // First create the game
        const gameRes = await apiRequest("POST", "/api/games", {
          displayName: "Host",
        });
        const gameData = await gameRes.json();
        
        // Store the tokens for future use
        sessionStorage.setItem(`game-${gameData.game.id}-hostToken`, gameData.hostToken);
        sessionStorage.setItem("hostToken", gameData.hostToken);
        
        // Then apply configuration to the new game
        const configRes = await apiRequest("POST", `/api/games/${gameData.game.id}/config`, configData, {
          headers: { Authorization: `Bearer ${gameData.hostToken}` },
        });
        
        // Update the URL to include the gameId
        setLocation(`/setup/${gameData.game.id}`);
        
        return { game: gameData.game, config: await configRes.json() };
      } else {
        // Existing flow for games that already exist
        const res = await apiRequest("POST", `/api/games/${gameId}/config`, configData, {
          headers: { Authorization: `Bearer ${hostToken}` },
        });
        return res.json();
      }
    },
    onSuccess: (data) => {
      const currentGameId = isNewGame ? data.game.id : gameId;
      queryClient.invalidateQueries({ queryKey: [`/api/games/${currentGameId}`] });
      setConfigurationStep('wines');
      toast({
        title: "Configuration Saved",
        description: "Game configuration set successfully!",
      });
      
      // Game created successfully
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
    mutationFn: async (newBottlesData: any[]) => {
      // Check if bottles already exist in database to determine POST vs PUT
      const hasExistingBottles = bottlesData?.bottles && bottlesData.bottles.length > 0;
      const method = hasExistingBottles ? "PUT" : "POST";
      
      const res = await apiRequest(method, `/api/games/${gameId}/bottles`, {
        bottles: newBottlesData,
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
        description: "Wines saved successfully!",
      });
      // Navigate directly to rounds to organize wines
      setLocation(`/rounds/${gameId}`);
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
  if (gameLoading || bottlesLoading) {
    return (
      <div className="container max-w-2xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  // Handle missing host token for existing games only
  if (!isNewGame && !hostToken) {
    setLocation("/");
    return null;
  }

  // Handle real games - check for game data and status (but only for existing games, not new ones)
  if (!isNewGame) {
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
      price: parseFloat(bottle.price),
    }));

    addBottlesMutation.mutate(bottlesData);
  };

  if (configurationStep === 'config') {
    return (
      <div className="min-h-screen bg-gray-50">
        <WineyHeader />
        <div className="container max-w-2xl mx-auto p-6 space-y-6">

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
  const currentBottleCount = bottles.length;
  const canRandomize = selectedConfig && currentBottleCount === selectedConfig.bottles;
  
  console.log('[DEBUG] canRandomize check:', {
    selectedConfig: !!selectedConfig,
    currentBottleCount,
    requiredBottles: selectedConfig?.bottles,
    canRandomize
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container max-w-4xl mx-auto p-6 space-y-6">

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
              <Badge variant="secondary">{(selectedConfig.ozPerPersonPerBottle / 100).toFixed(1)} oz pours</Badge>
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
                  onClick={() => setLocation(`/rounds/${gameId}`)}
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