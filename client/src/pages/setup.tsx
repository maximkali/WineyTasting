import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WineyHeader from "@/components/winey-header";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Setup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const createGameMutation = useMutation({
    mutationFn: async () => {
      const hostDisplayName = `${firstName} ${lastName}`.trim();
      const response = await apiRequest("POST", "/api/games", { hostDisplayName });
      return response.json();
    },
    onSuccess: (data) => {
      // Store the host token
      sessionStorage.setItem(`game-${data.game.id}-hostToken`, data.hostToken);
      
      toast({
        title: "Game created successfully!",
        description: "Setting up your wine tasting game...",
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
              
              <Button 
                type="submit" 
                className="w-full bg-wine hover:bg-wine/90 text-white"
                disabled={isCreatingGame}
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