import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import WineyHeader from "@/components/winey-header";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Are you hosting a blind tasting?</Label>
                </div>

                <Button
                  onClick={() => setLocation('/setup')}
                  className="w-full wine-gradient text-white py-4 rounded-full text-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Let's Get Started!
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
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

          {/* Game flow tagline */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            🍷 Sip → 🔢 Rank → ✅ Score → 🥇 Win
          </div>
        </div>
      </div>
    </div>
  );
}