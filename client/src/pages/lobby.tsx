import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";
import AdminPanel from "@/components/admin-panel";

export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: gameData, isLoading } = useGame(gameId!);

  const hostToken = localStorage.getItem("hostToken");
  const playerId = localStorage.getItem("playerId");
  const isHost = gameData?.players.find(p => p.id === playerId)?.isHost || false;
  const isSpectator = !playerId;

  // Auto-redirect if game starts
  useEffect(() => {
    if (gameData?.game.status === 'in_round') {
      setLocation(`/round/${gameId}/0`);
    }
  }, [gameData?.game.status, gameId, setLocation]);

  const startGameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/games/${gameId}/start`, {}, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      setLocation(`/round/${gameId}/0`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
        variant: "destructive",
      });
    },
  });

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

  if (!gameData?.game) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Game Not Found
            </h1>
            <Button onClick={() => setLocation("/")} className="wine-gradient text-white">
              🍷 Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { game, players } = gameData;
  const activePlayers = players.filter(p => p.status === 'active');

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8 mt-6">
          <h1 className="text-4xl font-bold text-wine mb-2">🍷 Winey</h1>
          <p className="text-lg text-gray-600">Wine Tasting Game</p>
          <div className="mt-4 bg-gold-gradient rounded-full px-4 py-2 inline-block">
            <span className="font-medium">Game Code: {gameId}</span>
          </div>
        </div>

        {/* Game Status */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Lobby</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Waiting to start</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-wine">5</div>
                <div className="text-sm text-gray-600">Rounds</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-wine">20</div>
                <div className="text-sm text-gray-600">Wines</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-wine">
                  {activePlayers.length}/20
                </div>
                <div className="text-sm text-gray-600">Players</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player List */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Players</h2>
            {activePlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p>No players have joined yet</p>
                <p className="text-sm mt-1">Share the game code: <strong>{gameId}</strong></p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 wine-gradient rounded-full flex items-center justify-center text-white font-bold">
                      {player.displayName[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{player.displayName}</div>
                      <div className="text-sm text-wine">
                        {player.isHost ? "👑 Host" : "Player"}
                      </div>
                    </div>
                    <div className="text-green-500">
                      ✓
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSpectator && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Invite friends with game code: <strong>{gameId}</strong>
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const gameUrl = `${window.location.origin}/join/${gameId}`;
                    navigator.clipboard.writeText(gameUrl);
                    toast({
                      title: "Link Copied!",
                      description: "Game link copied to clipboard",
                    });
                  }}
                  className="mt-2 border-wine text-wine hover:bg-rose"
                >
                  📋 Copy Game Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Host Controls */}
        {isHost && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Game Controls</h2>
              <div className="space-y-4">
                <Button
                  onClick={() => startGameMutation.mutate()}
                  disabled={startGameMutation.isPending || activePlayers.length === 0}
                  className="w-full wine-gradient text-white hover:opacity-90"
                >
                  {startGameMutation.isPending ? "Starting..." : "🍷 Start Wine Tasting"}
                </Button>
                {activePlayers.length === 0 && (
                  <p className="text-center text-sm text-gray-500">
                    Need at least 1 player to start
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isSpectator && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">👀</div>
              <h3 className="text-lg font-semibold mb-2">Spectator Mode</h3>
              <p className="text-gray-600">
                You're watching this game. You can see the action but won't participate in tasting.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {isHost && <AdminPanel gameId={gameId!} />}
    </div>
  );
}
