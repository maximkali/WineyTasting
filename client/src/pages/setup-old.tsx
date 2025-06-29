import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Settings, Users, Wine, RotateCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";
import { 
  getUniquePlayerCounts, 
  getBottleOptionsForPlayers, 
  getRoundOptions,
  type GameSetupOption 
} from "@shared/game-setups";

interface BottleData {
  labelName: string;
  funName: string;
  price: string;
}

export default function Setup() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: gameData, isLoading } = useGame(gameId!);
  
  const [bottles, setBottles] = useState<BottleData[]>(
    Array(20).fill(null).map(() => ({ labelName: "", funName: "", price: "" }))
  );

  const hostToken = localStorage.getItem("hostToken");

  useEffect(() => {
    if (!hostToken) {
      setLocation("/");
    }
  }, [hostToken, setLocation]);

  const addBottlesMutation = useMutation({
    mutationFn: async (bottlesData: any[]) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/bottles`, {
        bottles: bottlesData,
      }, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({
        title: "Success",
        description: "Wines added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add wines",
        variant: "destructive",
      });
    },
  });

  const randomizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/games/${gameId}/randomize`, {}, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      toast({
        title: "Success",
        description: "Wines randomized into rounds!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to randomize wines",
        variant: "destructive",
      });
    },
  });

  const updateBottle = (index: number, field: keyof BottleData, value: string) => {
    setBottles(prev => prev.map((bottle, i) => 
      i === index ? { ...bottle, [field]: value } : bottle
    ));
  };

  const deleteBottle = (index: number) => {
    setBottles(prev => prev.map((bottle, i) => 
      i === index ? { labelName: "", funName: "", price: "" } : bottle
    ));
  };

  const fillSampleWines = () => {
    const sampleWines = [
      { labelName: "Obama Napa Valley Cabernet", funName: "Presidential Punch", price: "85" },
      { labelName: "Château Margaux 2010", funName: "Fancy French Flex", price: "450" },
      { labelName: "Two Buck Chuck", funName: "Wallet Warrior", price: "3" },
      { labelName: "Kendall-Jackson Vintner's Reserve", funName: "Grape Expectations", price: "25" },
      { labelName: "Dom Pérignon 2012", funName: "Liquid Gold", price: "300" },
      { labelName: "Opus One 2018", funName: "Vintage Vibes", price: "250" },
      { labelName: "Yellowtail Shiraz", funName: "Kangaroo Kicks", price: "8" },
      { labelName: "Screaming Eagle Cabernet", funName: "Eagle's Cry", price: "2500" },
      { labelName: "Barefoot Moscato", funName: "Barefoot Bliss", price: "7" },
      { labelName: "Caymus Cabernet", funName: "California Dreams", price: "90" },
      { labelName: "Bogle Phantom", funName: "Ghost Wine", price: "18" },
      { labelName: "Silver Oak Alexander Valley", funName: "Silver Bullet", price: "120" },
      { labelName: "Kendall-Jackson Chardonnay", funName: "Buttery Smooth", price: "22" },
      { labelName: "La Crema Pinot Noir", funName: "Velvet Touch", price: "28" },
      { labelName: "Prisoner Red Blend", funName: "Jailbird Special", price: "45" },
      { labelName: "Duckhorn Merlot", funName: "Duck Dynasty", price: "65" },
      { labelName: "Stag's Leap Artemis", funName: "Leaping Stag", price: "75" },
      { labelName: "Far Niente Chardonnay", funName: "Nothing Matters", price: "55" },
      { labelName: "Cakebread Cellars Chardonnay", funName: "Sweet Bread", price: "48" },
      { labelName: "Jordan Cabernet Sauvignon", funName: "His Airness", price: "95" },
    ];
    setBottles(sampleWines);
  };

  const validateAndSubmit = () => {
    const filledBottles = bottles.filter(b => 
      b.labelName.trim() && b.price.trim()
    );

    if (filledBottles.length !== 20) {
      toast({
        title: "Incomplete",
        description: "Please enter all 20 wines with label names and prices.",
        variant: "destructive",
      });
      return;
    }

    // Check for unique prices
    const prices = filledBottles.map(b => parseInt(b.price));
    if (new Set(prices).size !== prices.length) {
      toast({
        title: "Duplicate Prices",
        description: "All wine prices must be unique.",
        variant: "destructive",
      });
      return;
    }

    // Check for unique label names
    const labelNames = filledBottles.map(b => b.labelName.toLowerCase().trim());
    if (new Set(labelNames).size !== labelNames.length) {
      toast({
        title: "Duplicate Names",
        description: "All label names must be unique.",
        variant: "destructive",
      });
      return;
    }

    const bottlesData = filledBottles.map(bottle => ({
      labelName: bottle.labelName.trim(),
      funName: bottle.funName.trim() || undefined,
      price: parseInt(bottle.price),
    }));

    addBottlesMutation.mutate(bottlesData);
  };

  const handleRandomize = () => {
    randomizeMutation.mutate();
  };

  const generateGameLink = () => {
    if (gameData?.game?.status === 'lobby') {
      const gameUrl = `${window.location.origin}/join/${gameId}`;
      navigator.clipboard.writeText(gameUrl);
      toast({
        title: "Link Copied!",
        description: "Game link copied to clipboard",
      });
      setLocation(`/lobby/${gameId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍷</div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameData?.game) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Game Not Found
            </h1>
            <Button onClick={() => setLocation("/")} className="wine-gradient text-white">
              🍷 Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedBottles = bottles.filter(b => b.labelName.trim() && b.price.trim()).length;
  const hasBottles = gameData.bottles && gameData.bottles.length > 0;
  const canRandomize = hasBottles && gameData.game.status === 'setup';
  const isRandomized = gameData.game.status === 'lobby';

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8 mt-6">
          <h1 className="text-4xl font-bold text-wine mb-2">🍷 Winey</h1>
          <p className="text-lg text-gray-600">Create your wine tasting game</p>
        </div>

        {/* Host Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Game Host</h2>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 wine-gradient rounded-full flex items-center justify-center text-white font-bold">
                {gameData.players.find(p => p.isHost)?.displayName?.[0] || "H"}
              </div>
              <div>
                <div className="text-lg font-medium text-wine">
                  {gameData.players.find(p => p.isHost)?.displayName || "Host"}
                </div>
                <p className="text-sm text-gray-500">Game Host</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wine Entry Form */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Wine Collection (20 bottles)</h2>
              <span className="text-sm text-gray-500">
                <span className="font-medium text-wine">{completedBottles}</span>/20 entered
              </span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {bottles.map((bottle, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 rounded-xl items-center"
                >
                  <div className="md:col-span-1 text-sm font-medium text-gray-600">
                    #{index + 1}
                  </div>
                  <div className="md:col-span-4">
                    <Input
                      placeholder="Label name (e.g., Obama)"
                      value={bottle.labelName}
                      onChange={(e) => updateBottle(index, "labelName", e.target.value)}
                      maxLength={20}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Input
                      placeholder="Fun name (optional)"
                      value={bottle.funName}
                      onChange={(e) => updateBottle(index, "funName", e.target.value)}
                      maxLength={40}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="number"
                      placeholder="Price $"
                      value={bottle.price}
                      onChange={(e) => updateBottle(index, "price", e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBottle(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={fillSampleWines}
                className="border-wine text-wine hover:bg-rose"
              >
                🎲 Fill Sample Wines
              </Button>
              <Button
                onClick={validateAndSubmit}
                disabled={addBottlesMutation.isPending || hasBottles}
                className="wine-gradient text-white hover:opacity-90"
              >
                {addBottlesMutation.isPending ? "Adding..." : "✅ Add Wines"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Randomization & Preview */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Round Assignment</h2>
            <div className="mb-4">
              <Button
                onClick={handleRandomize}
                disabled={!canRandomize || randomizeMutation.isPending}
                className="w-full md:w-auto wine-gradient text-white hover:opacity-90"
              >
                {randomizeMutation.isPending ? "Randomizing..." : "🎲 Randomize into 5 Rounds"}
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Assigns 4 wines to each of the 5 rounds randomly
              </p>
            </div>

            {/* Round Preview Grid */}
            {gameData.rounds && gameData.rounds.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {gameData.rounds.map((round, index) => (
                  <div key={round.id} className="bg-sage rounded-lg p-4">
                    <h3 className="font-medium text-center mb-3">Round {index + 1}</h3>
                    <div className="space-y-2">
                      {round.bottleIds.map((bottleId) => {
                        const bottle = gameData.bottles.find(b => b.id === bottleId);
                        return (
                          <div key={bottleId} className="bg-white rounded p-2 text-sm">
                            {bottle?.funName || bottle?.labelName || "Wine"}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Game Link */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Start Game</h2>
            <div className="space-y-4">
              <Button
                onClick={generateGameLink}
                disabled={!isRandomized}
                className="w-full wine-gradient text-white hover:opacity-90 disabled:opacity-50"
              >
                🍷 Generate Game Link
              </Button>
              <p className="text-sm text-gray-600 text-center">
                {!hasBottles
                  ? "Add wines first"
                  : !isRandomized
                  ? "Randomize wines into rounds first"
                  : "Ready to start!"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
