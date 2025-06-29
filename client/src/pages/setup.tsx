import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WineyHeader from "@/components/winey-header";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getUniquePlayerCounts, getBottleOptionsForPlayers } from "@/../../shared/game-setups";

export default function Setup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [bottleCount, setBottleCount] = useState<number | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const playerOptions = getUniquePlayerCounts();
  const bottleOptions = playerCount ? getBottleOptionsForPlayers(playerCount) : [];

  const createGameMutation = useMutation({
    mutationFn: async () => {
      const hostDisplayName = `${firstName} ${lastName}`.trim();
      const selectedConfig = bottleOptions.find(option => option.bottles === bottleCount);
      
      if (!selectedConfig) {
        throw new Error("Invalid game configuration selected");
      }
      
      const response = await apiRequest("POST", "/api/games", {
        hostDisplayName,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter both your first and last name.",
        variant: "destructive",
      });
      return;
    }

    if (!playerCount || !bottleCount) {
      toast({
        title: "Game setup required",
        description: "Please select the number of players and bottles.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingGame(true);
    createGameMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container max-w-md mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-wine">
              Setup Wine Tasting
            </CardTitle>
            <p className="text-center text-gray-600">
              Enter your name to create a new wine tasting game
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isCreatingGame}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isCreatingGame}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Number of Players</Label>
                  <Select 
                    onValueChange={(value) => {
                      setPlayerCount(parseInt(value));
                      setBottleCount(null); // Reset bottle count when player count changes
                    }}
                    disabled={isCreatingGame}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select number of players" />
                    </SelectTrigger>
                    <SelectContent>
                      {playerOptions.map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} players
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {playerCount && (
                  <div>
                    <Label>Number of Bottles</Label>
                    <Select 
                      onValueChange={(value) => setBottleCount(parseInt(value))}
                      disabled={isCreatingGame}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of bottles" />
                      </SelectTrigger>
                      <SelectContent>
                        {bottleOptions.map((option) => (
                          <SelectItem key={option.bottles} value={option.bottles.toString()}>
                            {option.bottles} bottles ({option.rounds} rounds, {option.bottlesPerRound} bottles per round)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-wine hover:bg-wine/90 text-white"
                disabled={isCreatingGame || !firstName || !lastName || !playerCount || !bottleCount}
              >
                {isCreatingGame ? "Creating Game..." : "Create Wine Tasting Game"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/")}
                disabled={isCreatingGame}
              >
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}