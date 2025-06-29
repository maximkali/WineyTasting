import { useLocation } from "wouter";

export default function HomeSimple() {
  const [, setLocation] = useLocation();

  const handleCreateGame = () => {
    setLocation("/setup");
  };

  const handleJoinGame = () => {
    setLocation("/join");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-rose-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">🍷</div>
              <div>
                <h1 className="text-2xl font-bold text-wine">WINEY</h1>
                <p className="text-sm text-muted-foreground">The Ultimate Taste Test</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-md mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Ready to host a blind tasting?</h2>
            </div>

            <button
              onClick={handleCreateGame}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-full text-lg font-medium hover:opacity-90 transition-opacity"
            >
              Let's Get Started!
            </button>

            <div className="text-center">
              <p className="text-gray-600 mb-3">Already have a game code?</p>
              <button
                onClick={handleJoinGame}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Join Existing Game
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6">
        <div className="text-white/80 text-lg font-medium">
          🍷 Sip → 🔢 Rank → ✅ Score → 🥇 Win
        </div>
      </div>
    </div>
  );
}