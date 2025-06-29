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

export default function SetupSimple() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hostName, setHostName] = useState("");
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const createGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/games", { hostDisplayName: hostName });
      return response.json();
    },
    onSuccess: (data) => {
      // Store the host token
      sessionStorage.setItem(`game-${data.game.id}-hostToken`, data.hostToken);
      
      toast({
        title: "Game created!",
        description: "Setting up your wine tasting game...",
      });
      
      // Navigate to the full setup page with the game ID
      setLocation(`/setup/${data.game.id}`);
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
    if (!hostName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue.",
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
            <CardTitle className="text-2xl font-bold text-center">
              Host a Wine Tasting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="hostName">Your Name</Label>
                <Input
                  id="hostName"
                  type="text"
                  placeholder="Enter your name"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  disabled={isCreatingGame}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-wine hover:bg-wine/90"
                disabled={isCreatingGame}
              >
                {isCreatingGame ? "Creating game..." : "Create Game"}
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