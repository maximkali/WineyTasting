interface LeaderboardProps {
  players: any[];
  title?: string;
  showRank?: boolean;
}

export default function Leaderboard({ 
  players, 
  title = "Leaderboard", 
  showRank = true 
}: LeaderboardProps) {
  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return "👑";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return "";
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0: return "gold-gradient";
      case 1: return "bg-gray-100";
      case 2: return "bg-gray-100";
      default: return "bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 text-center">{title}</h2>
      
      <div className="space-y-3">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-4 rounded-lg ${getRankBg(index)}`}
          >
            <div className="flex items-center space-x-4">
              {showRank && (
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">{getRankEmoji(index)}</div>
                  <div className="text-2xl font-bold text-wine">
                    {index === 0 ? "1st" : index === 1 ? "2nd" : index === 2 ? "3rd" : `${index + 1}th`}
                  </div>
                </div>
              )}
              <div className="w-12 h-12 wine-gradient rounded-full flex items-center justify-center text-white font-bold text-lg">
                {player.displayName[0]}
              </div>
              <div>
                <div className="font-bold text-lg">{player.displayName}</div>
                {player.isHost && (
                  <div className="text-sm text-wine">👑 Host</div>
                )}
              </div>
            </div>
            <div className="text-3xl font-bold text-wine">{player.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
