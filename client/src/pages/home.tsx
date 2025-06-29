import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import WineyHeader from "@/components/winey-header";

export default function Home() {
  const [, setLocation] = useLocation();
  const [hostName, setHostName] = useState("");
  const { toast } = useToast();

  const createGameMutation = useMutation({
    mutationFn: async (hostDisplayName: string) => {
      const res = await apiRequest("POST", "/api/games", { hostDisplayName });
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Game created successfully:", data);
      sessionStorage.setItem(`hostToken_${data.game.id}`, data.hostToken);
      sessionStorage.setItem(`playerId_${data.game.id}`, data.playerId);
      console.log("Navigating to:", `/setup/${data.game.id}`);
      
      // Try multiple navigation methods
      setLocation(`/setup/${data.game.id}`);
      
      // Fallback navigation
      setTimeout(() => {
        window.location.href = `/setup/${data.game.id}`;
      }, 100);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGame = () => {
    if (hostName.trim().length < 3) {
      toast({
        title: "Invalid Name",
        description: "Display name must be at least 3 characters long.",
        variant: "destructive",
      });
      return;
    }
    createGameMutation.mutate(hostName.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">

        <Card className="shadow-xl">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="hostName" className="text-base font-medium">
                  Your Display Name
                </Label>
                <Input
                  id="hostName"
                  type="text"
                  placeholder="Enter your name"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="mt-2"
                  maxLength={15}
                />
                <p className="text-sm text-gray-500 mt-1">
                  3-15 characters, you'll be the game host
                </p>
              </div>

              <Button
                onClick={handleCreateGame}
                disabled={createGameMutation.isPending || hostName.trim().length < 3}
                className="w-full wine-gradient text-white py-3 rounded-full text-lg font-medium hover:opacity-90 transition-opacity"
              >
                {createGameMutation.isPending ? "Creating..." : "🍷 Let's Get Started!"}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">
                  Already have a game code?
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const gameCode = prompt("Enter game code:");
                    if (gameCode) {
                      setLocation(`/join/${gameCode.toUpperCase()}`);
                    }
                  }}
                  className="border-wine text-wine hover:bg-rose"
                >
                  Join Existing Game
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🍷 Taste • Rank • Score • Win 🏆</p>
        </div>
        </div>
      </div>
    </div>
  );
}
