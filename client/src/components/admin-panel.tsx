import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Settings, Users, BarChart3, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminPanelProps {
  gameId: string;
}

type AdminTab = "status" | "players" | "controls";

export default function AdminPanel({ gameId }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("status");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: gameData } = useGame(gameId);
  
  const hostToken = localStorage.getItem("hostToken");

  const closeRoundMutation = useMutation({
    mutationFn: async () => {
      const currentRound = (gameData?.game.currentRound || 1) - 1;
      const res = await apiRequest(
        "POST",
        `/api/games/${gameId}/rounds/${currentRound}/close`,
        {},
        { headers: { Authorization: `Bearer ${hostToken}` } }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({ title: "Success", description: "Round closed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close round",
        variant: "destructive",
      });
    },
  });

  const nextRoundMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/games/${gameId}/next-round`,
        {},
        { headers: { Authorization: `Bearer ${hostToken}` } }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({ title: "Success", description: "Advanced to next round" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to advance round",
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
        { headers: { Authorization: `Bearer ${hostToken}` } }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({ title: "Success", description: "Game finished" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to finish game",
        variant: "destructive",
      });
    },
  });

  if (!gameData) return null;

  const { game, players } = gameData;
  const activePlayers = players.filter((p: any) => p.status === 'active');
  
  const handleConfirmAction = () => {
    switch (confirmAction) {
      case "close-round":
        closeRoundMutation.mutate();
        break;
      case "next-round":
        nextRoundMutation.mutate();
        break;
      case "finish-game":
        finishGameMutation.mutate();
        break;
    }
    setShowConfirmDialog(false);
    setConfirmAction("");
  };

  const getGameStatusText = () => {
    switch (game.status) {
      case 'setup': return "Setting up wines";
      case 'lobby': return "Waiting in lobby";
      case 'in_round': return `Round ${game.currentRound} in progress`;
      case 'reveal': return `Round ${game.currentRound} revealing`;
      case 'gambit': return "Sommelier's Gambit";
      case 'final': return "Game completed";
      default: return "Unknown";
    }
  };

  const tabs = [
    { id: "status", label: "Status", icon: BarChart3 },
    { id: "players", label: "Players", icon: Users },
    { id: "controls", label: "Controls", icon: Settings },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 wine-gradient rounded-full shadow-lg hover:opacity-90 transition-opacity"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
        </Button>
      </div>

      {/* Admin Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-2xl shadow-xl border z-40 fade-slide-in">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-wine">Admin Controls</h3>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`flex-1 py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-wine text-wine"
                      : "border-transparent text-gray-500 hover:text-wine"
                  }`}
                >
                  <Icon className="h-4 w-4 mx-auto mb-1" />
                  <div>{tab.label}</div>
                </button>
              );
            })}
          </div>
          
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Status Tab */}
            {activeTab === "status" && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Game Status</div>
                  <div className="text-lg font-bold text-wine">{getGameStatusText()}</div>
                </div>
                
                {game.status === 'in_round' && (
                  <div>
                    <div className="text-sm font-medium text-gray-700">Current Round</div>
                    <div className="text-lg font-bold text-wine">
                      Round {game.currentRound} of 5
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm font-medium text-gray-700">Active Players</div>
                  <div className="text-lg font-bold text-wine">
                    {activePlayers.length}/20
                  </div>
                  <Progress value={(activePlayers.length / 20) * 100} className="mt-2" />
                </div>
              </div>
            )}

            {/* Players Tab */}
            {activeTab === "players" && (
              <div className="space-y-3">
                {activePlayers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No active players
                  </div>
                ) : (
                  activePlayers.map((player: any) => (
                    <div
                      key={player.id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 wine-gradient rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {player.displayName[0]}
                        </div>
                        <span className="text-sm font-medium">{player.displayName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {player.isHost && (
                          <span className="text-xs text-wine font-medium">Host</span>
                        )}
                        <span className="text-sm font-bold text-wine">{player.score}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Controls Tab */}
            {activeTab === "controls" && (
              <div className="space-y-3">
                {game.status === 'in_round' && (
                  <Button
                    onClick={() => {
                      setConfirmAction("close-round");
                      setShowConfirmDialog(true);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={closeRoundMutation.isPending}
                  >
                    Close Round Early
                  </Button>
                )}
                
                {game.status === 'reveal' && (
                  <Button
                    onClick={() => {
                      setConfirmAction("next-round");
                      setShowConfirmDialog(true);
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={nextRoundMutation.isPending}
                  >
                    Advance to Next Round
                  </Button>
                )}
                
                {(game.status === 'in_round' || game.status === 'reveal' || game.status === 'gambit') && (
                  <Button
                    onClick={() => {
                      setConfirmAction("finish-game");
                      setShowConfirmDialog(true);
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    disabled={finishGameMutation.isPending}
                  >
                    End Game Early
                  </Button>
                )}
                
                {game.status === 'lobby' && (
                  <div className="text-center text-sm text-gray-500 py-4">
                    Use the main "Start Game" button to begin
                  </div>
                )}
                
                {game.status === 'final' && (
                  <div className="text-center text-sm text-gray-500 py-4">
                    Game has ended
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {confirmAction === "close-round" && 
                "Are you sure you want to close the current round early? Players who haven't submitted will get 0 points."}
              {confirmAction === "next-round" && 
                "Are you sure you want to advance to the next round?"}
              {confirmAction === "finish-game" && 
                "Are you sure you want to end the game early? This will skip any remaining rounds and go to final results."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAction} className="wine-gradient text-white">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
