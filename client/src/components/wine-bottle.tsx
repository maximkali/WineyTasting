import { cn } from "@/lib/utils";

interface WineBottleProps {
  className?: string;
  color?: "red" | "white" | "rose" | "gold";
  size?: "sm" | "md" | "lg";
}

export default function WineBottle({ 
  className, 
  color = "red", 
  size = "md" 
}: WineBottleProps) {
  const sizeClasses = {
    sm: "w-8 h-12",
    md: "w-16 h-20",
    lg: "w-24 h-32"
  };

  const colorClasses = {
    red: "from-green-800 to-green-900",
    white: "from-yellow-100 to-yellow-200",
    rose: "from-pink-200 to-pink-300",
    gold: "from-amber-400 to-amber-600"
  };

  return (
    <div 
      className={cn(
        "bg-gradient-to-b rounded-lg flex items-center justify-center relative overflow-hidden",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      {/* Bottle neck */}
      <div className="absolute top-0 w-1/3 h-1/4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-lg" />
      
      {/* Wine glass emoji */}
      <div className="text-white text-xs font-bold z-10">
        🍷
      </div>
      
      {/* Bottle highlight */}
      <div className="absolute top-2 left-1 w-1 h-1/2 bg-white opacity-30 rounded-full" />
    </div>
  );
}
