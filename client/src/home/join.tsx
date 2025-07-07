import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/common/lib/queryClient";
import { useToast } from "@/common/hooks/use-toast";
import { GameResponse, JoinGameResponse } from "@shared/types";

export default function Join() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const { toast } = useToast();

  const { data: gameData, isLoading } = useQuery<GameResponse>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });

  const joinGameMutation = useMutation<JoinGameResponse, Error, string>({
    mutationFn: async (displayName: string) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/join`, {
        displayName,
      });
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("playerId", data.player.id);
      setLocation(`/lobby/${gameId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleJoinGame = () => {
    if (playerName.trim().length < 3) {
      toast({
        title: "Invalid Name",
        description: "Display name must be at least 3 characters long.",
        variant: "destructive",
      });
      return;
    }
    joinGameMutation.mutate(playerName.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍷</div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Game Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              The game code "{gameId}" doesn't exist or has expired.
            </p>
            <Button onClick={() => setLocation("/")} className="wine-gradient text-white">
              🍷 Create New Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { game } = gameData;

  if (game.status === 'setup') {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-wine mb-2">
              Game Setting Up
            </h1>
            <p className="text-gray-600 mb-4">
              The host is still setting up the wine collection. Please wait...
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-wine text-wine hover:bg-rose"
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-wine mb-2">🍷 Winey</h1>
          <p className="text-lg text-gray-600">Join the wine tasting</p>
          <div className="mt-4 bg-gold-gradient rounded-full px-4 py-2 inline-block">
            <span className="font-medium">Game Code: {gameId}</span>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="playerName" className="text-base font-medium">
                  Your Display Name
                </Label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="mt-2"
                  maxLength={15}
                />
                <p className="text-sm text-gray-500 mt-1">
                  3-15 characters (names must be unique)
                </p>
              </div>

              <Button
                onClick={handleJoinGame}
                disabled={joinGameMutation.isPending || playerName.trim().length < 3}
                className="w-full wine-gradient text-white py-3 rounded-full text-lg font-medium hover:opacity-90 transition-opacity"
              >
                {joinGameMutation.isPending ? "Joining..." : "🍷 Join Game"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Players: {gameData.players?.length || 0}/20</p>
        </div>
      </div>
    </div>
  );
}
