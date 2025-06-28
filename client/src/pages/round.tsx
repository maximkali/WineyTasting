import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";
import RankingSystem from "@/components/ranking-system";
import AdminPanel from "@/components/admin-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TastingNotes {
  [bottleId: string]: string;
}

export default function Round() {
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
    refetchInterval: 5000, // Poll for updates
  });

  const [tastingNotes, setTastingNotes] = useState<TastingNotes>({});
  const [ranking, setRanking] = useState<string[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check if player has already submitted
  useEffect(() => {
    if (roundData?.submissions && playerId) {
      const playerSubmission = roundData.submissions.find(
        (s: any) => s.playerId === playerId && s.locked
      );
      setHasSubmitted(!!playerSubmission);
    }
  }, [roundData?.submissions, playerId]);

  // Auto-redirect if round is revealed
  useEffect(() => {
    if (roundData?.round?.revealed) {
      setLocation(`/reveal/${gameId}/${roundIndex}`);
    }
  }, [roundData?.round?.revealed, gameId, roundIndex, setLocation]);

  const submitTastingMutation = useMutation({
    mutationFn: async (data: { tastingNotes: TastingNotes; ranking: string[] }) => {
      const res = await apiRequest(
        "POST",
        `/api/games/${gameId}/rounds/${roundIdx}/submit`,
        data,
        {
          headers: { "x-player-id": playerId! },
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/rounds/${roundIdx}`] });
      setHasSubmitted(true);
      setShowSubmitModal(false);
      toast({
        title: "Submitted!",
        description: "Your tasting notes and ranking have been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit tasting",
        variant: "destructive",
      });
    },
  });

  const closeRoundMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/games/${gameId}/rounds/${roundIdx}/close`,
        {},
        {
          headers: { Authorization: `Bearer ${hostToken}` },
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/rounds/${roundIdx}`] });
      setLocation(`/reveal/${gameId}/${roundIndex}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close round",
        variant: "destructive",
      });
    },
  });

  if (!roundData) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍷</div>
          <p className="text-gray-600">Loading round...</p>
        </div>
      </div>
    );
  }

  const { round, bottles, submissions } = roundData;
  const submissionCount = submissions?.length || 0;
  const totalPlayers = gameData?.players.filter(p => p.status === 'active').length || 1;
  const progressPercentage = (submissionCount / totalPlayers) * 100;

  const updateTastingNote = (bottleId: string, note: string) => {
    setTastingNotes(prev => ({ ...prev, [bottleId]: note }));
  };

  const canSubmit = () => {
    if (hasSubmitted || isSpectator) return false;
    
    // Check all tasting notes are at least 10 characters
    const allNotesValid = bottles.every(
      (bottle: any) => (tastingNotes[bottle.id] || "").length >= 10
    );
    
    // Check ranking is complete
    const rankingComplete = ranking.length === 4 && 
      ranking.every(id => bottles.some((b: any) => b.id === id));
    
    return allNotesValid && rankingComplete;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    const notesData: TastingNotes = {};
    bottles.forEach((bottle: any) => {
      notesData[bottle.id] = tastingNotes[bottle.id] || "";
    });

    submitTastingMutation.mutate({
      tastingNotes: notesData,
      ranking,
    });
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Game Header */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-wine">
                  Round {roundIdx + 1} of 5
                </h1>
                <p className="text-gray-600">Taste and rank these 4 wines</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Submissions</div>
                <div className="text-xl font-bold text-wine">
                  {submissionCount}/{totalPlayers}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {hasSubmitted && !isSpectator && (
          <Card className="mb-6 bg-sage border-wine">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-semibold text-wine mb-1">Submission Complete</h3>
              <p className="text-sm text-gray-600">
                Waiting for other players... ({submissionCount}/{totalPlayers} submitted)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Wine Cards */}
        {!isSpectator && (
          <div className="space-y-6 mb-6">
            {bottles.map((bottle: any, index: number) => (
              <Card key={bottle.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-20 bg-gradient-to-b from-green-800 to-green-900 rounded-lg flex items-center justify-center">
                      <div className="text-white text-xs font-bold">🍷</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {bottle.funName || bottle.labelName}
                      </h3>
                      <div className="mb-4">
                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                          Your tasting notes (min 10 characters)
                        </Label>
                        <Textarea
                          placeholder="Describe the aroma, taste, finish, and overall impression..."
                          className="h-24 resize-none"
                          value={tastingNotes[bottle.id] || ""}
                          onChange={(e) => updateTastingNote(bottle.id, e.target.value)}
                          disabled={hasSubmitted}
                          maxLength={300}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {(tastingNotes[bottle.id] || "").length} characters (10 minimum)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Ranking Section */}
        {!isSpectator && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">💰 Price Ranking</h2>
              <p className="text-gray-600 mb-6">
                Drag wines from most expensive (💰💰💰💰) to least expensive (💰)
              </p>
              
              <RankingSystem
                bottles={bottles}
                ranking={ranking}
                onRankingChange={setRanking}
                disabled={hasSubmitted}
              />
            </CardContent>
          </Card>
        )}

        {/* Submit Section */}
        {!isSpectator && !hasSubmitted && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit()}
                  className="w-full wine-gradient text-white hover:opacity-90 disabled:opacity-50"
                >
                  🍷 Submit My Tasting
                </Button>
                <div className="text-center text-sm text-gray-500">
                  Complete all tasting notes (10+ characters) and rank all wines
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spectator View */}
        {isSpectator && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">👀</div>
              <h3 className="text-lg font-semibold mb-2">Spectator Mode</h3>
              <p className="text-gray-600 mb-4">
                Players are currently tasting and ranking wines in Round {roundIdx + 1}
              </p>
              <div className="text-2xl font-bold text-wine">
                {submissionCount}/{totalPlayers} submitted
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Confirmation Modal */}
        <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Submission</DialogTitle>
              <DialogDescription>
                You cannot edit your tasting notes or ranking after submitting. Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSubmit}
                disabled={submitTastingMutation.isPending}
                className="wine-gradient text-white"
              >
                {submitTastingMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isHost && <AdminPanel gameId={gameId!} />}
    </div>
  );
}
