import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Badge } from "@/common/ui/badge";
import { Trash2, Plus, ArrowRight } from "lucide-react";
import WineyHeader from "@/common/winey-header";
import { useToast } from "@/common/hooks/use-toast";
import { apiRequest } from "@/common/lib/queryClient";
import { useGame } from "@/common/hooks/use-game";

interface Wine {
  id: string;
  labelName: string;
  funName: string | null;
  price: number;
}

export default function WineList() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Game data using the hook
  const { data: gameData, isLoading, isError } = useGame(gameId!);

  // Host token retrieval
  const hostToken = gameId ? sessionStorage.getItem(`game-${gameId}-hostToken`) : null;

  // Bottles data
  const { data: bottlesData } = useQuery({
    queryKey: ['/api/games', gameId, 'bottles'],
    enabled: !!gameId && !!hostToken,
  });

  // Form state
  const [wines, setWines] = useState<Wine[]>([]);
  const [formData, setFormData] = useState({
    labelName: '',
    funName: '',
    price: ''
  });

  // Load existing bottles into form
  useEffect(() => {
    if (bottlesData?.bottles) {
      const wineData = bottlesData.bottles.map((bottle: any) => ({
        id: bottle.id,
        labelName: bottle.labelName,
        funName: bottle.funName,
        price: bottle.price / 100 // Convert from cents
      }));
      setWines(wineData);
    }
  }, [bottlesData]);

  // Store wines in session storage when they change
  useEffect(() => {
    if (gameId && wines.length > 0) {
      sessionStorage.setItem(`game-${gameId}-tempWines`, JSON.stringify(wines));
    }
  }, [wines, gameId]);

  const addWine = () => {
    if (!formData.labelName || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in label name and price",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error", 
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return;
    }

    const newWine: Wine = {
      id: Date.now().toString(),
      labelName: formData.labelName.trim(),
      funName: formData.funName.trim() || null,
      price: price
    };

    setWines([...wines, newWine]);
    setFormData({ labelName: '', funName: '', price: '' });
  };

  const removeWine = (id: string) => {
    setWines(wines.filter(w => w.id !== id));
  };

  const handleNext = () => {
    if (wines.length === 0) {
      toast({
        title: "Error", 
        description: "Please add wines before proceeding",
        variant: "destructive"
      });
      return;
    }

    if (wines.length !== game.totalBottles) {
      toast({
        title: "Warning",
        description: `You have ${wines.length} wines but the game expects ${game.totalBottles}. Please add more wines.`,
        variant: "destructive"
      });
      return;
    }

    // Store wines in session storage and navigate
    sessionStorage.setItem(`game-${gameId}-tempWines`, JSON.stringify(wines));
    navigate(`/rounds/${gameId}`);
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading game data</div>;
  if (!gameData) return <div>Game not found</div>;

  const { game } = gameData;

  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Wine List
          </h1>
          <p className="text-gray-600 text-center">
            Add your {game.totalBottles} wines for the tasting
          </p>
        </div>

        {/* Add Wine Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Wine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="labelName">Wine Label Name *</Label>
                <Input
                  id="labelName"
                  value={formData.labelName}
                  onChange={(e) => setFormData({ ...formData, labelName: e.target.value })}
                  placeholder="e.g., Chateau Margaux 2015"
                />
              </div>
              <div>
                <Label htmlFor="funName">Fun Name (Optional)</Label>
                <Input
                  id="funName"
                  value={formData.funName}
                  onChange={(e) => setFormData({ ...formData, funName: e.target.value })}
                  placeholder="e.g., The Mystery Red"
                />
              </div>
              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 25.99"
                />
              </div>
            </div>
            <Button onClick={addWine} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Wine
            </Button>
          </CardContent>
        </Card>

        {/* Wine List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Wines ({wines.length}/{game.totalBottles})</span>
              <Badge variant={wines.length === game.totalBottles ? "default" : "secondary"}>
                {wines.length === game.totalBottles ? "Complete" : "In Progress"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wines.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No wines added yet. Use the form above to add your first wine.
              </p>
            ) : (
              <div className="space-y-3">
                {wines.map((wine, index) => (
                  <div key={wine.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="flex-1">
                      <div className="font-medium">{wine.labelName}</div>
                      {wine.funName && (
                        <div className="text-sm text-gray-500">"{wine.funName}"</div>
                      )}
                      <div className="text-sm text-green-600 font-medium">${wine.price.toFixed(2)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWine(wine.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={wines.length === 0}
            className="flex items-center gap-2"
          >
            Continue to Rounds
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}