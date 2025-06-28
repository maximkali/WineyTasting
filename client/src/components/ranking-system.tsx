import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RankingSystemProps {
  bottles: any[];
  ranking: string[];
  onRankingChange: (ranking: string[]) => void;
  disabled?: boolean;
}

export default function RankingSystem({ 
  bottles, 
  ranking, 
  onRankingChange, 
  disabled = false 
}: RankingSystemProps) {
  const [draggedBottle, setDraggedBottle] = useState<any>(null);

  const handleDragStart = (bottle: any) => {
    if (disabled) return;
    setDraggedBottle(bottle);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (position: number) => {
    if (!draggedBottle || disabled) return;
    
    const newRanking = [...ranking];
    
    // Remove bottle from its current position if it exists
    const existingIndex = newRanking.indexOf(draggedBottle.id);
    if (existingIndex !== -1) {
      newRanking.splice(existingIndex, 1);
    }
    
    // Insert at new position
    newRanking.splice(position, 0, draggedBottle.id);
    
    // Ensure we only have 4 items max
    if (newRanking.length > 4) {
      newRanking.splice(4);
    }
    
    onRankingChange(newRanking);
    setDraggedBottle(null);
  };

  const removeFromRanking = (bottleId: string) => {
    if (disabled) return;
    const newRanking = ranking.filter(id => id !== bottleId);
    onRankingChange(newRanking);
  };

  const availableBottles = bottles.filter(bottle => !ranking.includes(bottle.id));

  const positions = [
    { label: "Most Expensive", emoji: "💰💰💰💰", position: 0 },
    { label: "#2", emoji: "💰💰💰", position: 1 },
    { label: "#3", emoji: "💰💰", position: 2 },
    { label: "Least Expensive", emoji: "💰", position: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {positions.map(({ label, emoji, position }) => {
          const bottleId = ranking[position];
          const bottle = bottles.find(b => b.id === bottleId);
          
          return (
            <div key={position} className="space-y-2">
              <div className="text-center font-medium text-wine">{label}</div>
              <div className="text-center text-2xl">{emoji}</div>
              <div
                className={`min-h-16 border-2 border-dashed rounded-lg p-2 transition-colors ${
                  disabled 
                    ? "border-gray-200 bg-gray-50" 
                    : "border-gray-300 hover:border-wine"
                }`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(position)}
              >
                {bottle ? (
                  <div className="bg-wine text-white p-2 rounded text-center">
                    <div className="font-medium text-sm">
                      {bottle.funName || bottle.labelName}
                    </div>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromRanking(bottle.id)}
                        className="text-white hover:text-gray-300 mt-1 h-auto p-0"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-2">
                    {disabled ? "Not ranked" : "Drop here"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Bottles */}
      {!disabled && availableBottles.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-3">
            Wines to rank:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableBottles.map((bottle) => (
              <div
                key={bottle.id}
                className="bg-sage p-3 rounded-lg cursor-move border-2 border-transparent hover:border-wine transition-colors"
                draggable
                onDragStart={() => handleDragStart(bottle)}
              >
                <div className="text-sm font-medium">
                  {bottle.funName || bottle.labelName}
                </div>
                <div className="text-xs text-gray-600">🍷</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile-friendly alternative for touch devices */}
      {!disabled && availableBottles.length > 0 && (
        <div className="md:hidden">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Tap to add to ranking:
          </div>
          <div className="space-y-2">
            {availableBottles.map((bottle) => (
              <Button
                key={bottle.id}
                variant="outline"
                onClick={() => {
                  const newRanking = [...ranking, bottle.id];
                  if (newRanking.length <= 4) {
                    onRankingChange(newRanking);
                  }
                }}
                className="w-full justify-start"
                disabled={ranking.length >= 4}
              >
                <span className="mr-2">🍷</span>
                {bottle.funName || bottle.labelName}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
