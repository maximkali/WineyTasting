import { useState } from "react";
import { useLocation } from "wouter";

export default function HomeSimple() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleCreateGame = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("Please enter both first and last name");
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const tempGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
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
              <h2 className="text-lg font-medium mb-4">Are you hosting a blind tasting? Enter your...</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={15}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={15}
                />
              </div>
            </div>

            <button
              onClick={handleCreateGame}
              disabled={!firstName.trim() || !lastName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-full text-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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