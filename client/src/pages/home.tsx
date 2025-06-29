import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Wine, Trophy, BarChart3, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showHostDialog, setShowHostDialog] = useState(false);

  const createGameMutation = useMutation({
    mutationFn: async () => {
      const displayName = `${firstName} ${lastName}`.trim();
      if (!displayName) throw new Error("Please enter your name");
      
      const res = await apiRequest("POST", "/api/games", { displayName });
      return res.json() as Promise<{ game: Game; hostToken: string }>;
    },
    onSuccess: (data) => {
      // Store host token in session storage
      sessionStorage.setItem("hostToken", data.hostToken);
      setLocation(`/setup/${data.game.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleHostGame = () => {
    setShowHostDialog(true);
  };

  const handleCreateGame = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your first and last name",
        variant: "destructive",
      });
      return;
    }
    createGameMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="w-full py-6 px-4 bg-white border-b">
        <div className="container max-w-6xl mx-auto flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Wine className="h-8 w-8 text-wine" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">WINEY</h1>
              <p className="text-xs text-gray-600">The Ultimate Taste Test</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Think you can taste a<br />difference?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Create a blind wine tasting experience for your friends. Guess, rank, and<br />
            discover who has the best wine knowledge.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handleHostGame}
              size="lg"
              className="bg-[#8B1A1A] hover:bg-[#7A1515] text-white font-medium px-8 py-3 text-base rounded-lg"
              disabled={createGameMutation.isPending}
            >
              {createGameMutation.isPending ? "Creating..." : "Host Tasting"}
            </Button>
            <Button 
              onClick={() => setLocation("/join")}
              variant="outline"
              size="lg"
              className="font-medium px-8 py-3 text-base border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Join Game
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mt-20">
          <div className="text-center">
            <div className="mb-4">
              <Wine className="h-12 w-12 mx-auto text-[#8B1A1A]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Blind Tasting</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Try 3 to 4 mystery<br />
              wines each round – no<br />
              labels, just taste and<br />
              instinct.
            </p>
          </div>

          <div className="text-center">
            <div className="mb-4">
              <BarChart3 className="h-12 w-12 mx-auto text-[#3B82F6]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Live Ranking</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Think you can price<br />
              them right? Stack each<br />
              wine from luxe to low-<br />
              end.
            </p>
          </div>

          <div className="text-center">
            <div className="mb-4">
              <CheckCircle2 className="h-12 w-12 mx-auto text-[#10B981]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Smart Scoring</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Once everyone votes,<br />
              see how your picks<br />
              stacked up against<br />
              your friends.
            </p>
          </div>

          <div className="text-center">
            <div className="mb-4">
              <Trophy className="h-12 w-12 mx-auto text-[#F59E0B]" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Compete & Win</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Top taster takes the<br />
              crown. Bragging rights<br />
              (and maybe a<br />
              hangover) await.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-gray-100 border-t">
        <div className="flex items-center justify-center space-x-4 text-gray-600 text-sm">
          <span className="flex items-center">
            <Wine className="h-4 w-4 mr-2 text-[#8B1A1A]" />
            Sip
          </span>
          <span>→</span>
          <span className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-[#3B82F6]" />
            Rank
          </span>
          <span>→</span>
          <span className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-[#10B981]" />
            Score
          </span>
          <span>→</span>
          <span className="flex items-center">
            <Trophy className="h-4 w-4 mr-2 text-[#F59E0B]" />
            Win
          </span>
        </div>
      </footer>

      {/* Host Game Dialog */}
      <Dialog open={showHostDialog} onOpenChange={setShowHostDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome! Let's get started</DialogTitle>
            <DialogDescription>
              Enter your name to create a new wine tasting session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGame()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGame()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHostDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGame}
              disabled={createGameMutation.isPending}
              className="bg-[#8B1A1A] hover:bg-[#7A1515] text-white"
            >
              {createGameMutation.isPending ? "Creating..." : "Create Game"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}