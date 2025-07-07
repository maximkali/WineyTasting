import { useEffect } from "react";
import { useParams, useSearch, useLocation } from "wouter";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/common/lib/queryClient";
import { useToast } from "@/common/hooks/use-toast";
import { useGame } from "@/common/hooks/use-game";
import AdminPanel from "@/setup/admin-panel";
import { GameResponse } from "@shared/types";

export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const [search] = useSearch();
  const [, navigate] = useLocation();
  const isHostFromUrl = search.includes('host=true');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    data: gameData, 
    isLoading, 
    error: gameError,
    refetch: refetchGame 
  } = useGame<GameResponse>(gameId!);
  
  // Log game data changes
  useEffect(() => {
    if (gameError) {
      console.error(`[Lobby] Error loading game ${gameId}:`, gameError);
    }
    if (gameData) {
      console.log(`[Lobby] Successfully loaded game ${gameId}:`, gameData);
    }
  }, [gameData, gameError, gameId]);

  // Debug logging
  useEffect(() => {
    console.log('[DEBUG] Lobby - Game Data:', gameData);
    console.log('[DEBUG] Lobby - Game ID:', gameId);
    console.log('[DEBUG] Lobby - Player ID from session:', sessionStorage.getItem(`game-${gameId}-playerId`));
    console.log('[DEBUG] Lobby - Host Token from session:', sessionStorage.getItem(`game-${gameId}-hostToken`));
    
    if (gameError) {
      console.error('[ERROR] Error loading game data:', gameError);
    }
  }, [gameData, gameId, gameError]);
  
  // Add a retry mechanism if game data fails to load
  useEffect(() => {
    if (gameError && !isLoading) {
      console.log('[DEBUG] Attempting to refetch game data...');
      const retryTimer = setTimeout(() => {
        refetchGame();
      }, 1000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [gameError, isLoading, refetchGame]);

  // Get host token and player ID from session storage
  const hostToken = sessionStorage.getItem(`game-${gameId}-hostToken`);
  const playerId = sessionStorage.getItem(`game-${gameId}-playerId`);
  
  // Determine host status
  const isHost = isHostFromUrl || 
                gameData?.players?.find((p) => p.id === playerId)?.isHost || 
                false;
  // Ensure player is logged in
  useEffect(() => {
    if (!playerId) {
      navigate(`/join/${gameId}`);
    }
  }, [playerId, gameId, navigate]);

  // Auto-redirect if game starts
  useEffect(() => {
    if (gameData?.game?.status === 'in_round') {
      navigate(`/round/${gameId}/0`);
    }
  }, [gameData?.game?.status, gameId, navigate]);

  if (isLoading || !gameData) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading game data...</p>
          {gameError && (
            <p className="text-red-500 mt-2">
              Error loading game. Retrying...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Redirect to join if no player ID
  if (!playerId) {
    navigate(`/join/${gameId}`);
    return null;
  }

  const startGameMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log('[DEBUG] Starting game with:', { 
          gameId, 
          hasHostToken: !!hostToken,
          isHost,
          playerId
        });
        
        const res = await apiRequest("POST", `/api/games/${gameId}/start`, {}, {
          headers: { Authorization: `Bearer ${hostToken}` },
        });
        
        if (!res.ok) {
          const error = await res.text();
          console.error('[ERROR] Failed to start game:', error);
          throw new Error(error);
        }
        
        return res.json();
      } catch (error) {
        console.error('[ERROR] Start game mutation failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[DEBUG] Game started successfully');
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      navigate(`/round/${gameId}/0`);
    },
    onError: (error: any) => {
      console.error('[ERROR] Start game failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
        variant: "destructive",
      });
    },
  });



  if (!gameData?.game) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Game Not Found
            </h1>
            <Button onClick={() => navigate("/")} className="wine-gradient text-white">
              🍷 Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { game, players } = gameData as GameResponse;
  const activePlayers = players.filter((p) => p.status === 'active');
  
  // Calculate game setup progress
  const totalBottles = game.totalBottles || 0;
  const totalRounds = game.totalRounds || 0;

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
              <h2 className="text-xl font-semibold">Lobby - {game.hostName}'s Game</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  {isHost ? 'You are the host' : 'Waiting for host to start'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Players</p>
                <p className="text-lg font-semibold">{activePlayers.length}/{game.maxPlayers || 20}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Bottles</p>
                <p className="text-lg font-semibold">{totalBottles} of {game.totalBottles || 0}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Rounds</p>
                <p className="text-lg font-semibold">{totalRounds}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Pours</p>
                <p className="text-lg font-semibold">{game.ozPerPersonPerBottle ? Number(game.ozPerPersonPerBottle).toFixed(1) : '0.0'} oz</p>
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
      </div>
      
      {isHost && <AdminPanel gameId={gameId!} />}
    </div>
  );
}
