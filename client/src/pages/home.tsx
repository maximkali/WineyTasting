import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import WineyHeader from "@/components/winey-header";

export default function Home() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();

  // Generate temporary game ID for session storage
  const generateTempGameId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGame = () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Please enter your name",
        description: "Both first and last name are required.",
        variant: "destructive",
      });
      return;
    }

    // Generate temporary game ID and store host info in session
    const tempGameId = generateTempGameId();
    const tempHostToken = Math.random().toString(36).substring(2, 32);
    
    sessionStorage.setItem(`tempGame_${tempGameId}`, JSON.stringify({
      hostDisplayName: fullName,
      gameId: tempGameId,
      hostToken: tempHostToken,
      created: new Date().toISOString(),
      status: 'temp'
    }));
    
    console.log("Starting temporary game:", tempGameId);
    setLocation(`/setup/${tempGameId}`);
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
                <Label className="text-base font-medium">Are you hosting a blind tasting? Enter your...</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={15}
                  />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={15}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateGame}
                disabled={!firstName.trim() || !lastName.trim()}
                className="w-full wine-gradient text-white py-4 rounded-full text-lg font-medium hover:opacity-90 transition-opacity"
              >
                Let's Get Started!
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              {/* Quick access to existing game with wines */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">
                  Continue your existing game with wines:
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Direct link to your game with wines
                    setLocation(`/setup/RLCDK7?hostToken=55ec72cdc54b4e62cc4098560abcf4ac8bdec1390fb03cefaa09cb8c76e90f61`);
                  }}
                  className="border-wine text-wine hover:bg-rose mb-3"
                >
                  Continue Game RLCDK7 (Your Wines)
                </Button>
              </div>
              
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

        </div>
      </div>
    </div>
  );
}