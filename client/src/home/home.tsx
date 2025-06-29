import { useLocation } from "wouter";

import { Button } from "@/common/ui/button";
import { Trophy, BarChart3, CheckCircle2 } from "lucide-react";
import WineyHeader from "@/common/winey-header";

export default function Home() {
  const [, setLocation] = useLocation();

  const handleHostGame = () => {
    console.log("Host Tasting button clicked - navigating to /setup");
    setLocation("/setup");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <WineyHeader />

      {/* Main Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Think you can taste a difference?
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
            >
              Host Tasting
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
              <div className="text-5xl">🍷</div>
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
              <div className="text-5xl">🔢</div>
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
              <div className="text-5xl">✅</div>
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
              <div className="text-5xl">🏆</div>
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
            <span className="mr-2 text-[#8B1A1A]">🍷</span>
            Sip
          </span>
          <span>→</span>
          <span className="flex items-center">
            <span className="mr-2 text-[#3B82F6]">🔢</span>
            Rank
          </span>
          <span>→</span>
          <span className="flex items-center">
            <span className="mr-2 text-[#10B981]">✅</span>
            Score
          </span>
          <span>→</span>
          <span className="flex items-center">
            <span className="mr-2 text-[#F59E0B]">🏆</span>
            Win
          </span>
        </div>
      </footer>


    </div>
  );
}