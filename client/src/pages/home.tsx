import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import WineyHeader from "@/components/winey-header";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      
      {/* Main content area */}
      <div className="flex flex-col items-center justify-center px-4 py-24">
        <div className="text-center max-w-2xl mx-auto space-y-12">
          
          {/* Hero section */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Ready to test your palate?
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Create a blind wine tasting experience for your friends. 
              Guess, rank, and discover who has the best wine knowledge.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <Button
              onClick={() => setLocation('/setup')}
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105 min-w-[180px]"
            >
              Host a Tasting
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const gameCode = prompt("Enter your game code:");
                if (gameCode) {
                  setLocation(`/join/${gameCode.toUpperCase()}`);
                }
              }}
              className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 px-12 py-4 text-lg font-semibold rounded-lg transition-all min-w-[180px]"
            >
              Join Game
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            <div className="text-center space-y-3">
              <div className="text-3xl">🍷</div>
              <h3 className="font-semibold text-gray-900">Blind Tasting</h3>
              <p className="text-gray-600 text-sm">Try 3 to 4 mystery wines each round – no labels, just taste and instinct.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold text-gray-900">Live Ranking</h3>
              <p className="text-gray-600 text-sm">Think you can price them right? Stack each wine from luxe to low-end.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-3xl">✅</div>
              <h3 className="font-semibold text-gray-900">Smart Scoring</h3>
              <p className="text-gray-600 text-sm">Once everyone votes, see how your picks stacked up against your friends.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-3xl">🏆</div>
              <h3 className="font-semibold text-gray-900">Compete & Win</h3>
              <p className="text-gray-600 text-sm">Top taster takes the crown. Bragging rights (and maybe a hangover) await.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom emoji navigation */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>🍷</span>
            <span>Sip</span>
            <span>→</span>
            <span>📊</span>
            <span>Rank</span>
            <span>→</span>
            <span>✅</span>
            <span>Score</span>
            <span>→</span>
            <span>🏆</span>
            <span>Win</span>
          </div>
        </div>
      </div>
    </div>
  );
}