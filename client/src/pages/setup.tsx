import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Users, Wine } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  getUniquePlayerCounts, 
  getBottleOptionsForPlayers,
  type GameSetupOption 
} from "@/../../shared/game-setups";

export default function Setup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hostName, setHostName] = useState("");
  const [configStep, setConfigStep] = useState<'host' | 'config' | 'review'>('host');
  const [selectedConfig, setSelectedConfig] = useState<GameSetupOption | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const playerOptions = getUniquePlayerCounts();

  const createGameMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConfig) {
        throw new Error("Please complete the game configuration");
      }
      
      const response = await apiRequest("POST", "/api/games", {
        hostDisplayName: hostName.trim(),
        maxPlayers: selectedConfig.players,
        totalBottles: selectedConfig.bottles,
        totalRounds: selectedConfig.rounds,
        bottlesPerRound: selectedConfig.bottlesPerRound,
        bottleEqPerPerson: selectedConfig.bottleEqPerPerson,
        ozPerPersonPerBottle: selectedConfig.ozPerPersonPerBottle,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Store the host token
      sessionStorage.setItem(`game-${data.game.id}-hostToken`, data.hostToken);
      
      toast({
        title: "Game created successfully!",
        description: `Game ID: ${data.game.id} - Now add your wines!`,
      });
      
      // Navigate to the organize page with the game ID
      setLocation(`/organize/${data.game.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating game",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsCreatingGame(false);
    },
  });

  const handleHostNameSubmit = () => {
    if (!hostName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }
    setConfigStep('config');
  };

  const handleConfigSubmit = () => {
    if (!selectedConfig) {
      toast({
        title: "Configuration required",
        description: "Please select your game configuration.",
        variant: "destructive",
      });
      return;
    }
    setConfigStep('review');
  };

  const handleFinalSubmit = () => {
    setIsCreatingGame(true);
    createGameMutation.mutate();
  };

  // Host Name Step
  if (configStep === 'host') {
    return (
      <div className="min-h-screen bg-warm-white">
        <div className="max-w-lg mx-auto p-4">
          {/* Header */}
          <div className="text-center mb-8 mt-6">
            <h1 className="text-4xl font-bold text-wine mb-2">🍷 Winey</h1>
            <p className="text-lg text-gray-600">Let's set up your wine tasting game!</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-wine mb-2">
                Welcome, Host!
              </CardTitle>
              <p className="text-gray-600">
                What should we call you during the game?
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="hostName">Your Name</Label>
                <Input
                  id="hostName"
                  type="text"
                  placeholder="Enter your name (e.g., Sarah)"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  maxLength={30}
                  className="text-lg"
                />
              </div>
              
              <Button 
                onClick={handleHostNameSubmit}
                className="w-full wine-gradient text-white text-lg py-3"
                disabled={!hostName.trim()}
              >
                Continue to Game Setup
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/")}
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Configuration Step
  if (configStep === 'config') {
    return (
      <div className="min-h-screen bg-warm-white">
        <div className="max-w-2xl mx-auto p-4">
          {/* Header */}
          <div className="text-center mb-8 mt-6">
            <h1 className="text-4xl font-bold text-wine mb-2">🍷 Winey</h1>
            <p className="text-lg text-gray-600">Configure your wine tasting game</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-wine mb-2 flex items-center justify-center gap-2">
                <Settings className="h-6 w-6" />
                Game Configuration
              </CardTitle>
              <p className="text-gray-600">
                Choose your game setup based on the number of players
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Player Count Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-wine" />
                  Number of Players
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {playerOptions.map((count) => (
                    <Button
                      key={count}
                      variant={selectedConfig?.players === count ? "default" : "outline"}
                      className={selectedConfig?.players === count ? "wine-gradient text-white" : ""}
                      onClick={() => {
                        const configs = getBottleOptionsForPlayers(count);
                        setSelectedConfig(configs[0]); // Default to first option
                      }}
                    >
                      {count} players
                    </Button>
                  ))}
                </div>
              </div>

              {/* Configuration Options */}
              {selectedConfig && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Wine className="h-5 w-5 text-wine" />
                    Game Format
                  </h3>
                  <div className="space-y-3">
                    {getBottleOptionsForPlayers(selectedConfig.players).map((config, index) => (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedConfig.bottles === config.bottles
                            ? "border-wine bg-wine/5"
                            : "border-gray-200 hover:border-wine/50"
                        }`}
                        onClick={() => setSelectedConfig(config)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-wine">
                              {config.bottles} Bottles • {config.rounds} Rounds
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {config.bottlesPerRound} bottles per round • {config.bottleEqPerPerson} bottle equivalents per person • {config.ozPerPersonPerBottle}oz per bottle per person
                            </div>
                          </div>
                          {selectedConfig.bottles === config.bottles && (
                            <Badge className="wine-gradient text-white">Selected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfigStep('host')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleConfigSubmit}
                  className="flex-1 wine-gradient text-white"
                  disabled={!selectedConfig}
                >
                  Review Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Review Step
  if (configStep === 'review') {
    return (
      <div className="min-h-screen bg-warm-white">
        <div className="max-w-2xl mx-auto p-4">
          {/* Header */}
          <div className="text-center mb-8 mt-6">
            <h1 className="text-4xl font-bold text-wine mb-2">🍷 Winey</h1>
            <p className="text-lg text-gray-600">Review your game setup</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-wine mb-2">
                Ready to Create Your Game?
              </CardTitle>
              <p className="text-gray-600">
                Review the details below and create your wine tasting game
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Host Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-wine mb-2">Game Host</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 wine-gradient rounded-full flex items-center justify-center text-white font-bold">
                    {hostName[0]?.toUpperCase()}
                  </div>
                  <div className="font-medium">{hostName}</div>
                </div>
              </div>

              {/* Game Configuration */}
              {selectedConfig && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-wine mb-3">Game Configuration</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Players</div>
                      <div className="text-lg font-semibold text-wine">{selectedConfig.players}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Total Bottles</div>
                      <div className="text-lg font-semibold text-wine">{selectedConfig.bottles}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Rounds</div>
                      <div className="text-lg font-semibold text-wine">{selectedConfig.rounds}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Bottles per Round</div>
                      <div className="text-lg font-semibold text-wine">{selectedConfig.bottlesPerRound}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfigStep('config')}
                  className="flex-1"
                  disabled={isCreatingGame}
                >
                  Back to Setup
                </Button>
                <Button 
                  onClick={handleFinalSubmit}
                  className="flex-1 wine-gradient text-white"
                  disabled={isCreatingGame}
                >
                  {isCreatingGame ? "Creating Game..." : "🍷 Create Game"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}