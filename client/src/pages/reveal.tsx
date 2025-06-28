import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";
import Leaderboard from "@/components/leaderboard";
import AdminPanel from "@/components/admin-panel";

export default function Reveal() {
  const { gameId, roundIndex } = useParams<{ gameId: string; roundIndex: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const roundIdx = parseInt(roundIndex || "0");
  const playerId = localStorage.getItem("playerId");
  const hostToken = localStorage.getItem("hostToken");
  const isSpectator = !playerId;

  const { data: gameData } = useGame(gameId!);
  const isHost = gameData?.players.find(p => p.id === playerId)?.isHost || false;

  const { data: roundData } = useQuery({
    queryKey: [`/api/games/${gameId}/rounds/${roundIdx}`],
    enabled: !!gameId,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: [`/api/games/${gameId}/leaderboard`],
    enabled: !!gameId,
  });

  // Auto-redirect based on game state
  useEffect(() => {
    if (gameData?.game.status === 'in_round') {
      const currentRound = gameData.game.currentRound - 1;
      setLocation(`/round/${gameId}/${currentRound}`);
    } else if (gameData?.game.status === 'gambit') {
      setLocation(`/gambit/${gameId}`);
    } else if (gameData?.game.status === 'final') {
      setLocation(`/final/${gameId}`);
    }
  }, [gameData?.game.status, gameData?.game.currentRound, gameId, setLocation]);

  const nextRoundMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/games/${gameId}/next-round`,
        {},
        {
          headers: { Authorization: `Bearer ${hostToken}` },
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      // Navigation will be handled by useEffect above
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to advance round",
        variant: "destructive",
      });
    },
  });

  if (!roundData || !leaderboardData) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍷</div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const { round, bottles, correctOrder, submissions } = roundData;
  const { leaderboard } = leaderboardData;

  // Get player's submission and score
  const playerSubmission = submissions.find((s: any) => s.playerId === playerId);
  const playerScore = playerSubmission?.points || 0;

  // Create ordered bottles for display
  const orderedBottles = correctOrder.map((bottleId: string) => 
    bottles.find((b: any) => b.id === bottleId)
  ).filter(Boolean);

  const isLastRound = roundIdx === 4;

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Round Header */}
        <div className="text-center mb-8 mt-6">
          <h1 className="text-4xl font-bold text-wine mb-2">
            Round {roundIdx + 1} Results
          </h1>
          <p className="text-lg text-gray-600">The wine prices revealed!</p>
        </div>

        {/* Player's Score */}
        {!isSpectator && (
          <Card className="mb-6 bg-sage border-wine">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">
                {playerScore === 4 ? "🎯" : playerScore >= 2 ? "🍷" : "😅"}
              </div>
              <h3 className="text-xl font-bold text-wine mb-1">
                You scored {playerScore} points!
              </h3>
              <p className="text-sm text-gray-600">
                {playerScore === 4 && "Perfect round! 🎉"}
                {playerScore === 3 && "Excellent tasting! 👏"}
                {playerScore === 2 && "Good job! 👍"}
                {playerScore === 1 && "Not bad! Keep trying! 💪"}
                {playerScore === 0 && "Better luck next round! 🤞"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Correct Order */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-center">
              🏆 Correct Price Order
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {orderedBottles.map((bottle: any, index: number) => (
                <div
                  key={bottle.id}
                  className={`text-center p-4 rounded-xl ${
                    index === 0 
                      ? "gold-gradient" 
                      : "bg-gray-100"
                  }`}
                >
                  <div className="text-4xl mb-2">
                    {index === 0 ? "👑" : index === 1 ? "🥈" : index === 2 ? "🥉" : "💰"}
                  </div>
                  <div className="font-bold text-lg">
                    {bottle.funName || bottle.labelName}
                  </div>
                  <div className="text-2xl font-bold text-wine mt-2">
                    ${bottle.price}
                  </div>
                  <div className="text-sm text-gray-600">
                    {index === 0 && "Most Expensive"}
                    {index === 1 && "#2"}
                    {index === 2 && "#3"}
                    {index === 3 && "Least Expensive"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Player Results */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">
              Round {roundIdx + 1} Scoring
            </h2>
            
            <div className="space-y-3">
              {submissions.map((submission: any) => {
                const player = gameData?.players.find(p => p.id === submission.playerId);
                if (!player) return null;

                const isPerfect = submission.points === 4;
                
                return (
                  <div
                    key={submission.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isPerfect 
                        ? "bg-sage border-2 border-wine" 
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 wine-gradient rounded-full flex items-center justify-center text-white font-bold">
                        {player.displayName[0]}
                      </div>
                      <div>
                        <span className="font-medium">{player.displayName}</span>
                        {isPerfect && (
                          <span className="ml-2 text-sm font-medium text-wine">
                            🎯 Perfect!
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-lg text-wine">
                      +{submission.points}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Leaderboard players={leaderboard} title="🏆 Current Leaderboard" />

        {/* Next Round Button */}
        {isHost && (
          <Card className="mt-6">
            <CardContent className="p-6 text-center">
              <Button
                onClick={() => nextRoundMutation.mutate()}
                disabled={nextRoundMutation.isPending}
                className="w-full wine-gradient text-white hover:opacity-90"
              >
                {nextRoundMutation.isPending 
                  ? "Loading..." 
                  : isLastRound 
                    ? "Continue to Sommelier's Gambit 🍷" 
                    : `Continue to Round ${roundIdx + 2} 🍷`
                }
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                {isLastRound 
                  ? "Final bonus round!" 
                  : `${4 - roundIdx} more rounds to go!`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {isHost && <AdminPanel gameId={gameId!} />}
    </div>
  );
}
