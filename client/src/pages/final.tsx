import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";
import { formatPrice, copyToClipboard } from "@/lib/game-utils";
import Leaderboard from "@/components/leaderboard";

export default function Final() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const playerId = localStorage.getItem("playerId");
  const isSpectator = !playerId;

  const { data: gameData, isLoading } = useGame(gameId!);
  
  const { data: leaderboardData } = useQuery({
    queryKey: [`/api/games/${gameId}/leaderboard`],
    enabled: !!gameId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍷</div>
          <p className="text-gray-600">Loading final results...</p>
        </div>
      </div>
    );
  }

  if (!gameData?.game || !leaderboardData) {
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
  const { leaderboard } = leaderboardData;
  
  const winner = leaderboard[0];
  const currentPlayer = leaderboard.find((p: any) => p.id === playerId);
  
  // Sort bottles by price (descending)
  const sortedBottles = [...bottles].sort((a: any, b: any) => b.price - a.price);
  const mostExpensive = sortedBottles[0];
  const leastExpensive = sortedBottles[sortedBottles.length - 1];

  const handleDownloadResults = () => {
    toast({
      title: "Download Started",
      description: "Results are being prepared for download...",
    });
    // In a real implementation, this would generate and download a PDF
  };

  const handleShareResults = async () => {
    try {
      const gameUrl = `${window.location.origin}/join/${gameId}`;
      await copyToClipboard(gameUrl);
      toast({
        title: "Link Copied!",
        description: "Game link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-6xl mx-auto p-4">
        {/* Winner Announcement */}
        <div className="text-center mb-8 mt-6">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold text-wine mb-2">Game Complete!</h1>
          <div className="text-2xl font-semibold text-charcoal mb-2">
            Winner: <span className="text-wine">{winner?.displayName || "Unknown"}</span>
          </div>
          <p className="text-lg text-gray-600">
            Final Score: <span className="font-bold text-wine">{winner?.score || 0}</span> points
          </p>
        </div>

        {/* Final Leaderboard */}
        <div className="mb-8">
          <Leaderboard players={leaderboard} title="🏆 Final Leaderboard" />
        </div>

        {/* Personal Summary */}
        {!isSpectator && currentPlayer && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-6">🎯 Your Performance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-sage rounded-xl">
                  <div className="text-3xl font-bold text-wine mb-2">
                    {currentPlayer.score}
                  </div>
                  <div className="font-medium">Total Score</div>
                  <div className="text-sm text-gray-600">
                    Rank: {leaderboard.findIndex((p: any) => p.id === playerId) + 1} of {leaderboard.length}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-rose rounded-xl">
                  <div className="text-3xl font-bold text-wine mb-2">
                    {leaderboard.findIndex((p: any) => p.id === playerId) + 1}
                  </div>
                  <div className="font-medium">Final Position</div>
                  <div className="text-sm text-gray-600">
                    Out of {leaderboard.length} players
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gold-gradient rounded-xl">
                  <div className="text-3xl font-bold text-wine mb-2">
                    {Math.round((currentPlayer.score / Math.max(winner?.score || 1, 1)) * 100)}%
                  </div>
                  <div className="font-medium">Of Winner's Score</div>
                  <div className="text-sm text-gray-600">
                    Relative performance
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Wine List */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-6">🍷 Complete Wine Collection</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2">Rank</th>
                    <th className="text-left py-3 px-2">Fun Name</th>
                    <th className="text-left py-3 px-2">Label Name</th>
                    <th className="text-left py-3 px-2">Price</th>
                    <th className="text-left py-3 px-2">Round</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {sortedBottles.map((bottle: any, index: number) => (
                    <tr key={bottle.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <span className="flex items-center space-x-2">
                          <span className="font-bold">{index + 1}</span>
                          {index === 0 && <span className="text-xl">👑</span>}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {bottle.funName || bottle.labelName}
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {bottle.labelName}
                      </td>
                      <td className="py-3 px-2 font-bold text-wine">
                        {formatPrice(bottle.price)}
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        Round {(bottle.roundIndex || 0) + 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Wine Highlights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gold-gradient rounded-lg">
                <h3 className="font-semibold mb-2">💰 Most Expensive</h3>
                <div className="font-medium">{mostExpensive?.funName || mostExpensive?.labelName}</div>
                <div className="text-sm text-gray-600">{mostExpensive?.labelName}</div>
                <div className="text-lg font-bold text-wine">{formatPrice(mostExpensive?.price || 0)}</div>
              </div>
              
              <div className="p-4 bg-sage rounded-lg">
                <h3 className="font-semibold mb-2">🤑 Least Expensive</h3>
                <div className="font-medium">{leastExpensive?.funName || leastExpensive?.labelName}</div>
                <div className="text-sm text-gray-600">{leastExpensive?.labelName}</div>
                <div className="text-lg font-bold text-wine">{formatPrice(leastExpensive?.price || 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleDownloadResults}
                className="wine-gradient text-white hover:opacity-90"
              >
                📄 Download Results PDF
              </Button>
              <Button
                onClick={handleShareResults}
                variant="outline"
                className="border-wine text-wine hover:bg-rose"
              >
                📋 Share Game Link
              </Button>
            </div>
            
            <div className="mt-6 text-center">
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                🍷 Create New Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
