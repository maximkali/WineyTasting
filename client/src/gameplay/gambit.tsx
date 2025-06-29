import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/common/lib/queryClient";
import { useToast } from "@/common/hooks/use-toast";
import { useGame } from "@/common/hooks/use-game";
import AdminPanel from "@/setup/admin-panel";

interface GambitSelections {
  mostExpensive: string | null;
  leastExpensive: string | null;
  favorite: string | null;
}

export default function Gambit() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const playerId = localStorage.getItem("playerId");
  const hostToken = localStorage.getItem("hostToken");
  const isSpectator = !playerId;

  const { data: gameData, isLoading } = useGame(gameId!);
  const isHost = gameData?.players.find(p => p.id === playerId)?.isHost || false;

  const [selections, setSelections] = useState<GambitSelections>({
    mostExpensive: null,
    leastExpensive: null,
    favorite: null,
  });

  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Auto-redirect if game moves to final
  useEffect(() => {
    if (gameData?.game.status === 'final') {
      setLocation(`/final/${gameId}`);
    }
  }, [gameData?.game.status, gameId, setLocation]);

  const submitGambitMutation = useMutation({
    mutationFn: async (data: { mostExpensive: string; leastExpensive: string; favorite: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/games/${gameId}/gambit`,
        data,
        {
          headers: { "x-player-id": playerId! },
        }
      );
      return res.json();
    },
    onSuccess: () => {
      setHasSubmitted(true);
      toast({
        title: "Submitted!",
        description: "Your Sommelier's Gambit selections have been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit gambit",
        variant: "destructive",
      });
    },
  });

  const finishGameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/games/${gameId}/finish`,
        {},
        {
          headers: { Authorization: `Bearer ${hostToken}` },
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      setLocation(`/final/${gameId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to finish game",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍷</div>
          <p className="text-gray-600">Loading Sommelier's Gambit...</p>
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

  const { bottles } = gameData;

  const handleSelection = (selectionType: keyof GambitSelections, bottleId: string) => {
    if (hasSubmitted || isSpectator) return;

    setSelections(prev => ({
      ...prev,
      [selectionType]: bottleId,
    }));
  };

  const canSubmit = () => {
    if (hasSubmitted || isSpectator) return false;
    
    const { mostExpensive, leastExpensive, favorite } = selections;
    return mostExpensive && leastExpensive && favorite && mostExpensive !== leastExpensive;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    
    submitGambitMutation.mutate({
      mostExpensive: selections.mostExpensive!,
      leastExpensive: selections.leastExpensive!,
      favorite: selections.favorite!,
    });
  };

  const getSelectionName = (bottleId: string | null) => {
    if (!bottleId) return null;
    const bottle = bottles.find((b: any) => b.id === bottleId);
    return bottle?.funName || bottle?.labelName;
  };

  const selectionTypes = [
    {
      key: "mostExpensive" as const,
      title: "💰 Most Expensive Wine",
      description: "Which wine do you think had the highest price?",
      emoji: "💰",
    },
    {
      key: "leastExpensive" as const,
      title: "🤑 Least Expensive Wine", 
      description: "Which wine do you think had the lowest price?",
      emoji: "🤑",
    },
    {
      key: "favorite" as const,
      title: "❤️ Your Favorite Wine",
      description: "Which wine did you enjoy the most?",
      emoji: "❤️",
    },
  ];

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8 mt-6">
          <h1 className="text-4xl font-bold text-wine mb-2">🍷 Sommelier's Gambit</h1>
          <p className="text-lg text-gray-600">Bonus round! Make your final predictions</p>
          <div className="mt-4 bg-gold-gradient rounded-full px-4 py-2 inline-block">
            <span className="font-medium">+2 points per correct guess</span>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">How to Play</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-semibold mb-2">Most Expensive</h3>
                <p className="text-sm text-gray-600">
                  Pick which wine had the highest price across all 20 bottles
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🤑</div>
                <h3 className="font-semibold mb-2">Least Expensive</h3>
                <p className="text-sm text-gray-600">
                  Pick which wine had the lowest price across all 20 bottles
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">❤️</div>
                <h3 className="font-semibold mb-2">Personal Favorite</h3>
                <p className="text-sm text-gray-600">
                  Pick your favorite wine from all the ones you tasted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasSubmitted && !isSpectator && (
          <Card className="mb-6 bg-sage border-wine">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-semibold text-wine mb-1">Gambit Submitted</h3>
              <p className="text-sm text-gray-600">
                Your predictions have been recorded. Waiting for results...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Gambit Selections */}
        {!isSpectator && (
          <div className="space-y-6">
            {selectionTypes.map((selectionType) => (
              <Card key={selectionType.key}>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{selectionType.title}</h2>
                  <p className="text-gray-600 mb-4">{selectionType.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {bottles.map((bottle: any) => (
                      <div
                        key={bottle.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors border-2 ${
                          selections[selectionType.key] === bottle.id
                            ? "bg-gold-gradient border-wine"
                            : hasSubmitted
                            ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                            : "bg-gray-50 border-transparent hover:bg-rose hover:border-wine"
                        }`}
                        onClick={() => handleSelection(selectionType.key, bottle.id)}
                      >
                        <div className="font-medium text-sm">
                          {bottle.funName || bottle.labelName}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Round {(bottle.roundIndex || 0) + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selections[selectionType.key] && (
                    <div className="mt-4 p-3 bg-gold-gradient rounded-lg border-2 border-wine">
                      <div className="font-medium">
                        Selected: <strong>{getSelectionName(selections[selectionType.key])}</strong>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Spectator View */}
        {isSpectator && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">👀</div>
              <h3 className="text-lg font-semibold mb-2">Spectator Mode</h3>
              <p className="text-gray-600">
                Players are making their final predictions in the Sommelier's Gambit.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {!isSpectator && !hasSubmitted && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit() || submitGambitMutation.isPending}
                  className="w-full wine-gradient text-white hover:opacity-90 disabled:opacity-50"
                >
                  {submitGambitMutation.isPending 
                    ? "Submitting..." 
                    : "🍷 Submit Sommelier's Gambit"
                  }
                </Button>
                <div className="text-center text-sm text-gray-500">
                  {!selections.mostExpensive && "Select most expensive wine"}
                  {selections.mostExpensive && !selections.leastExpensive && "Select least expensive wine"}
                  {selections.mostExpensive && selections.leastExpensive && selections.mostExpensive === selections.leastExpensive && "Most and least expensive cannot be the same"}
                  {selections.mostExpensive && selections.leastExpensive && selections.mostExpensive !== selections.leastExpensive && !selections.favorite && "Select your favorite wine"}
                  {canSubmit() && "Ready to submit!"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Host Controls */}
        {isHost && (
          <Card className="mt-6">
            <CardContent className="p-6 text-center">
              <Button
                onClick={() => finishGameMutation.mutate()}
                disabled={finishGameMutation.isPending}
                className="w-full wine-gradient text-white hover:opacity-90"
              >
                {finishGameMutation.isPending ? "Finishing..." : "🏁 Finish Game & Show Results"}
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                End the Sommelier's Gambit and show final results
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {isHost && <AdminPanel gameId={gameId!} />}
    </div>
  );
}
