import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Settings, Users, Wine, RotateCcw } from "lucide-react";
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
  const [_, setLocation] = useLocation();
  const hostToken = sessionStorage.getItem(`hostToken_${gameId}`);
  const { data: gameData } = useGame(gameId!);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
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
      }
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

  if (!gameData?.game || !hostToken) {
    setLocation("/");
    return null;
  }

  if (gameData.game.status !== "setup") {
    setLocation(`/game/${gameId}/lobby`);
    return null;
  }

  const saveConfigMutation = useMutation({
    mutationFn: async (config: GameSetupOption) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/config`, config, {
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
    mutationFn: async (bottlesData: any[]) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/bottles`, {
        bottles: bottlesData,
      }, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({
        title: "Success",
        description: "Wines added successfully!",
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
    saveConfigMutation.mutate(selectedConfig);
  };

  const handleWineSubmit = () => {
    if (!selectedConfig) return;
    
    const validBottles = bottles.filter(b => 
      b.labelName.trim() && b.price.trim() && !isNaN(parseFloat(b.price))
    );
    
    if (validBottles.length !== selectedConfig.bottles) {
      toast({
        title: "Error",
        description: `Please enter exactly ${selectedConfig.bottles} valid wines with prices.`,
        variant: "destructive",
      });
      return;
    }

    const bottlesData = validBottles.map(bottle => ({
      labelName: bottle.labelName.trim(),
      funName: bottle.funName.trim() || null,
      price: parseFloat(bottle.price),
    }));

    addBottlesMutation.mutate(bottlesData);
  };

  const resetConfiguration = () => {
    setConfigurationStep('config');
    setSelectedPlayers(null);
    setSelectedBottles(null);
    setSelectedConfig(null);
    setBottles([]);
  };

  if (configurationStep === 'config') {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Game Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Players Dropdown */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Players
                </Label>
                <Select value={selectedPlayers?.toString()} onValueChange={(value) => {
                  setSelectedPlayers(parseInt(value));
                  setSelectedBottles(null);
                  setSelectedConfig(null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player count" />
                  </SelectTrigger>
                  <SelectContent>
                    {playerOptions.map(count => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} players
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bottles Dropdown */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wine className="h-4 w-4" />
                  Bottles
                </Label>
                <Select 
                  value={selectedBottles?.toString()} 
                  onValueChange={(value) => {
                    setSelectedBottles(parseInt(value));
                  }}
                  disabled={!selectedPlayers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bottle count" />
                  </SelectTrigger>
                  <SelectContent>
                    {bottleOptions.map(option => (
                      <SelectItem key={option.bottles} value={option.bottles.toString()}>
                        {option.bottles} bottles
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rounds Display */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Rounds
                </Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                  {selectedConfig ? `${selectedConfig.rounds} rounds` : "Auto-calculated"}
                </div>
              </div>
            </div>

            {/* Configuration Details */}
            {selectedConfig && (
              <div className="space-y-4">
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Badge variant="outline" className="p-3 justify-center">
                    <div className="text-center">
                      <div className="font-semibold">{selectedConfig.bottlesPerRound}</div>
                      <div className="text-xs text-muted-foreground">bottles per round</div>
                    </div>
                  </Badge>
                  <Badge variant="outline" className="p-3 justify-center">
                    <div className="text-center">
                      <div className="font-semibold">{selectedConfig.bottleEqPerPerson.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">bottle equivalent per person</div>
                    </div>
                  </Badge>
                  <Badge variant="outline" className="p-3 justify-center">
                    <div className="text-center">
                      <div className="font-semibold">{selectedConfig.ozPerPersonPerBottle.toFixed(1)} oz</div>
                      <div className="text-xs text-muted-foreground">per person per bottle</div>
                    </div>
                  </Badge>
                </div>
                
                <Button 
                  onClick={handleConfigSave} 
                  disabled={saveConfigMutation.isPending}
                  className="w-full"
                >
                  {saveConfigMutation.isPending ? "Saving..." : "Save Configuration & Continue"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wine entry step
  const canRandomize = selectedConfig && gameData.bottleCount === selectedConfig.bottles;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wine className="h-5 w-5" />
              <CardTitle>Wine Entry</CardTitle>
            </div>
            <Button onClick={resetConfiguration} variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Change Config
            </Button>
          </div>
          {selectedConfig && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">{selectedConfig.players} players</Badge>
              <Badge variant="secondary">{selectedConfig.bottles} bottles</Badge>
              <Badge variant="secondary">{selectedConfig.rounds} rounds</Badge>
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
              Add Wine
            </Button>
          </div>

          <div className="space-y-3">
            {bottles.map((bottle, index) => (
              <div key={index} className="flex gap-3 items-center p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`label-${index}`}>Wine Name</Label>
                  <Input
                    id={`label-${index}`}
                    value={bottle.labelName}
                    onChange={(e) => updateBottle(index, "labelName", e.target.value)}
                    placeholder="e.g., Château Margaux 2019"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`fun-${index}`}>Fun Name (Optional)</Label>
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
              {addBottlesMutation.isPending ? "Adding..." : "Add Wines"}
            </Button>
            
            {canRandomize && (
              <Button 
                onClick={() => randomizeMutation.mutate()}
                disabled={randomizeMutation.isPending}
                className="flex-1"
              >
                {randomizeMutation.isPending ? "Randomizing..." : `Randomize into ${selectedConfig?.rounds} Rounds`}
              </Button>
            )}
          </div>

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
  );
}