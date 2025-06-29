import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wine, Plus, X, ArrowLeft, ArrowRight, Users, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import WineyHeader from "@/components/winey-header";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GameSetupOption, getBottleOptionsForPlayers, getRoundOptions, getUniquePlayerCounts } from "@shared/game-setups";

// Define the steps
type SetupStep = "home" | "host" | "config" | "wines" | "rounds";

// Wine interface
interface Wine {
  id?: string;
  labelName: string;
  funName: string;
  price: string;
  originalIndex?: number;
}

// Host form schema
const hostFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
});

// Wine form schema
const wineFormSchema = z.object({
  wines: z.array(z.object({
    labelName: z.string().min(1, "Wine name is required"),
    funName: z.string().min(1, "Fun name is required"),
    price: z.string()
      .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number (e.g., 25 or 25.99)")
      .refine((val) => parseFloat(val) > 0, "Price must be greater than 0")
  }))
});

export default function SetupUnified() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<SetupStep>("home");
  const [isLocked, setIsLocked] = useState(false);
  
  // Data state
  const [hostName, setHostName] = useState("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<GameSetupOption | null>(null);
  const [wines, setWines] = useState<Wine[]>([]);
  const [rounds, setRounds] = useState<Wine[][]>([]);
  
  // Host form
  const hostForm = useForm<z.infer<typeof hostFormSchema>>({
    resolver: zodResolver(hostFormSchema),
    defaultValues: {
      displayName: "",
    },
  });
  
  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: async (displayName: string) => {
      const response = await apiRequest("POST", "/api/games", { displayName });
      return response.json();
    },
    onSuccess: (data) => {
      setGameId(data.game.id);
      setHostToken(data.hostToken);
      sessionStorage.setItem(`game-${data.game.id}-hostToken`, data.hostToken);
      setHostName(data.game.hostName);
      setCurrentStep("config");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating game",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Final save mutation
  const finalSaveMutation = useMutation({
    mutationFn: async () => {
      if (!gameId || !hostToken || !selectedConfig) {
        throw new Error("Missing required data");
      }
      
      // Save game configuration
      await apiRequest("POST", `/api/games/${gameId}/config`, selectedConfig, {
        headers: { Authorization: `Bearer ${hostToken}` }
      });
      
      // Create a mapping of wines with their round assignments
      const wineToRoundMap = new Map<number, number>();
      rounds.forEach((roundWines, roundIndex) => {
        roundWines.forEach(wine => {
          if (wine.originalIndex !== undefined) {
            wineToRoundMap.set(wine.originalIndex, roundIndex);
          }
        });
      });
      
      // Save bottles with round assignments
      const bottlesData = wines.map((wine, index) => ({
        labelName: wine.labelName,
        funName: wine.funName,
        price: parseFloat(wine.price),
        roundIndex: wineToRoundMap.get(wine.originalIndex ?? index) ?? null
      }));
      
      const response = await apiRequest("PUT", `/api/games/${gameId}/bottles`, { bottles: bottlesData }, {
        headers: { Authorization: `Bearer ${hostToken}` }
      });
      
      const createdBottles = await response.json();
      
      // Now update bottles with round assignments using their IDs
      if (createdBottles.bottles) {
        for (const bottle of createdBottles.bottles) {
          if (bottle.roundIndex !== null) {
            await apiRequest("PATCH", `/api/games/${gameId}/bottles/${bottle.id}`, {
              roundIndex: bottle.roundIndex
            }, {
              headers: { Authorization: `Bearer ${hostToken}` }
            });
          }
        }
      }
      
      // Start the game
      await apiRequest("POST", `/api/games/${gameId}/start`, undefined, {
        headers: { Authorization: `Bearer ${hostToken}` }
      });
      
      return { gameId, hostToken };
    },
    onSuccess: (data) => {
      setIsLocked(true);
      toast({
        title: "Game setup complete!",
        description: "Players can now join the lobby.",
      });
      navigate(`/lobby/${data.gameId}?hostToken=${data.hostToken}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving game",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Navigation handlers
  const handleHostSubmit = (values: z.infer<typeof hostFormSchema>) => {
    createGameMutation.mutate(values.displayName);
  };
  
  const handleConfigSelect = (config: GameSetupOption) => {
    setSelectedConfig(config);
    // Initialize empty wines array
    const emptyWines = Array(config.bottles).fill(null).map((_, index) => ({
      labelName: "",
      funName: "",
      price: "",
      originalIndex: index,
    }));
    setWines(emptyWines);
    // Initialize empty rounds
    const emptyRounds = Array(config.rounds).fill(null).map(() => []);
    setRounds(emptyRounds);
    setCurrentStep("wines");
  };
  
  const handleWineUpdate = (index: number, field: keyof Wine, value: string) => {
    const newWines = [...wines];
    newWines[index] = { ...newWines[index], [field]: value };
    setWines(newWines);
  };
  
  const handleAutoAssign = () => {
    if (!selectedConfig) return;
    
    const unassigned = wines.filter(wine => 
      !rounds.flat().some(w => w.originalIndex === wine.originalIndex)
    );
    
    let wineIndex = 0;
    const newRounds = [...rounds];
    
    for (let roundIdx = 0; roundIdx < newRounds.length; roundIdx++) {
      while (newRounds[roundIdx].length < selectedConfig.bottlesPerRound && wineIndex < unassigned.length) {
        newRounds[roundIdx].push(unassigned[wineIndex]);
        wineIndex++;
      }
    }
    
    setRounds(newRounds);
  };
  
  const handleMixEmUp = () => {
    const allAssigned = rounds.flat();
    const shuffled = [...allAssigned].sort(() => Math.random() - 0.5);
    
    const newRounds = rounds.map(() => [] as Wine[]);
    let wineIndex = 0;
    
    for (let roundIdx = 0; roundIdx < newRounds.length; roundIdx++) {
      while (newRounds[roundIdx].length < (selectedConfig?.bottlesPerRound || 0) && wineIndex < shuffled.length) {
        newRounds[roundIdx].push(shuffled[wineIndex]);
        wineIndex++;
      }
    }
    
    setRounds(newRounds);
  };
  
  const handleAddWines = (roundIndex: number, selectedWines: Wine[]) => {
    const newRounds = [...rounds];
    newRounds[roundIndex] = [...newRounds[roundIndex], ...selectedWines];
    setRounds(newRounds);
  };
  
  const handleRemoveWine = (roundIndex: number, wineIndex: number) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].splice(wineIndex, 1);
    setRounds(newRounds);
  };
  
  // Validation helpers
  const isWineDataValid = () => {
    return wines.every(wine => 
      wine.labelName.trim() !== "" && 
      wine.funName.trim() !== "" && 
      wine.price.trim() !== "" &&
      /^\d+(\.\d{1,2})?$/.test(wine.price) &&
      parseFloat(wine.price) > 0
    );
  };
  
  const isRoundsComplete = () => {
    return rounds.every(round => round.length === selectedConfig?.bottlesPerRound) &&
           rounds.flat().length === wines.length;
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "home":
        return (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  <Wine className="h-16 w-16 text-wine" />
                </div>
                <CardTitle className="text-3xl font-bold text-wine">Winey</CardTitle>
                <p className="mt-2 text-lg text-gray-600">
                  The Ultimate Wine Tasting Game
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setCurrentStep("host")}
                  className="w-full bg-wine hover:bg-wine/90"
                  size="lg"
                >
                  Create New Game
                </Button>
                <div className="text-center text-sm text-gray-500">
                  Players can join using the game code
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case "host":
        return (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...hostForm}>
                  <form onSubmit={hostForm.handleSubmit(handleHostSubmit)} className="space-y-6">
                    <FormField
                      control={hostForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your name" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is how players will identify you as the host
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-wine hover:bg-wine/90"
                      disabled={createGameMutation.isPending}
                    >
                      {createGameMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Game...
                        </>
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
        
      case "config":
        const playerCounts = getUniquePlayerCounts();
        const selectedPlayers = selectedConfig?.players || playerCounts[0];
        const bottleOptions = getBottleOptionsForPlayers(selectedPlayers);
        const selectedBottles = selectedConfig?.bottles || bottleOptions[0]?.bottles;
        const roundOptions = getRoundOptions(selectedPlayers, selectedBottles);
        
        return (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Game Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Number of Players</label>
                  <Select
                    value={selectedPlayers.toString()}
                    onValueChange={(value) => {
                      const players = parseInt(value);
                      const newBottleOptions = getBottleOptionsForPlayers(players);
                      if (newBottleOptions.length > 0) {
                        setSelectedConfig(newBottleOptions[0]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {playerCounts.map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {count} Players
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Number of Bottles</label>
                  <Select
                    value={selectedBottles?.toString()}
                    onValueChange={(value) => {
                      const bottles = parseInt(value);
                      const option = bottleOptions.find(opt => opt.bottles === bottles);
                      if (option) {
                        setSelectedConfig(option);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bottleOptions.map((option) => (
                        <SelectItem key={option.bottles} value={option.bottles.toString()}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {option.bottles} Bottles
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedConfig && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Rounds:</span> {selectedConfig.rounds}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Bottles per round:</span> {selectedConfig.bottlesPerRound}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Ounces per person per bottle:</span> {selectedConfig.ozPerPersonPerBottle}
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={() => handleConfigSelect(selectedConfig!)}
                  className="w-full bg-wine hover:bg-wine/90"
                  disabled={!selectedConfig}
                >
                  Continue to Wine List
                </Button>
              </CardContent>
            </Card>
          </div>
        );
        
      case "wines":
        return (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Wine List</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep("config")}
                    disabled={isLocked}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Enter details for all {selectedConfig?.bottles} wines
                  </p>
                  
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {wines.map((wine, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-wine text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="font-medium">Wine {index + 1}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="text-sm font-medium">Wine Name</label>
                                <Input
                                  value={wine.labelName}
                                  onChange={(e) => handleWineUpdate(index, "labelName", e.target.value)}
                                  placeholder="e.g., Château Margaux 2010"
                                  disabled={isLocked}
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Fun Name</label>
                                <Input
                                  value={wine.funName}
                                  onChange={(e) => handleWineUpdate(index, "funName", e.target.value)}
                                  placeholder="e.g., Midnight Mystery"
                                  disabled={isLocked}
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Price ($)</label>
                                <Input
                                  value={wine.price}
                                  onChange={(e) => handleWineUpdate(index, "price", e.target.value)}
                                  placeholder="e.g., 29.99"
                                  disabled={isLocked}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      onClick={() => setCurrentStep("rounds")}
                      className="bg-wine hover:bg-wine/90"
                      disabled={!isWineDataValid() || isLocked}
                    >
                      Continue to Rounds
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case "rounds":
        const unassignedWines = wines.filter(wine => 
          !rounds.flat().some(w => w.originalIndex === wine.originalIndex)
        );
        
        return (
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Organize Rounds</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep("wines")}
                    disabled={isLocked}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Control buttons */}
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={handleAutoAssign}
                      disabled={unassignedWines.length === 0 || isLocked}
                      variant="outline"
                      size="sm"
                    >
                      🤖 Auto Assign
                    </Button>
                    
                    <Button
                      onClick={handleMixEmUp}
                      disabled={rounds.flat().length === 0 || isLocked}
                      variant="outline"
                      size="sm"
                    >
                      🔀 Mix 'Em Up
                    </Button>
                  </div>
                  
                  {/* Unassigned wines */}
                  {unassignedWines.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h3 className="font-medium mb-3">Unassigned Wines ({unassignedWines.length})</h3>
                      <div className="flex flex-wrap gap-2">
                        {unassignedWines.map((wine) => (
                          <div key={wine.originalIndex} className="bg-white dark:bg-gray-800 border rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-wine text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {String.fromCharCode(65 + (wine.originalIndex || 0))}
                              </div>
                              <span className="text-sm">{wine.labelName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Rounds */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rounds.map((round, roundIndex) => (
                      <Card key={roundIndex}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Round {roundIndex + 1}</h3>
                            <Badge variant={round.length === selectedConfig?.bottlesPerRound ? "default" : "secondary"}>
                              {round.length}/{selectedConfig?.bottlesPerRound}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 min-h-[100px]">
                            {round.map((wine, wineIndex) => (
                              <div key={wineIndex} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-wine text-white rounded-full flex items-center justify-center text-xs font-bold">
                                      {String.fromCharCode(65 + (wine.originalIndex || 0))}
                                    </div>
                                    <span className="text-sm">{wine.labelName}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveWine(roundIndex, wineIndex)}
                                    disabled={isLocked}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {round.length < (selectedConfig?.bottlesPerRound || 0) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    disabled={unassignedWines.length === 0 || isLocked}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Wine
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Add Wine to Round {roundIndex + 1}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {unassignedWines.map((wine) => (
                                      <div
                                        key={wine.originalIndex}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                                        onClick={() => {
                                          handleAddWines(roundIndex, [wine]);
                                          // Close dialog
                                          document.body.click();
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-wine text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {String.fromCharCode(65 + (wine.originalIndex || 0))}
                                          </div>
                                          <div>
                                            <div className="font-medium">{wine.labelName}</div>
                                            <div className="text-sm text-gray-600">"{wine.funName}"</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => finalSaveMutation.mutate()}
                      disabled={!isRoundsComplete() || finalSaveMutation.isPending || isLocked}
                      className="bg-wine hover:bg-wine/90"
                    >
                      {finalSaveMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving Game...
                        </>
                      ) : (
                        "Start Game"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Progress indicator - only show after home */}
        {currentStep !== "home" && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center ${currentStep === "host" ? "text-wine" : "text-gray-400"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "host" ? "bg-wine text-white" : "bg-gray-200"}`}>
                    1
                  </div>
                  <span className="ml-2 font-medium">Host</span>
                </div>
                
                <div className="w-12 h-0.5 bg-gray-300" />
                
                <div className={`flex items-center ${currentStep === "config" ? "text-wine" : currentStep === "wines" || currentStep === "rounds" ? "text-gray-600" : "text-gray-400"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "config" ? "bg-wine text-white" : currentStep === "wines" || currentStep === "rounds" ? "bg-gray-600 text-white" : "bg-gray-200"}`}>
                    2
                  </div>
                  <span className="ml-2 font-medium">Setup</span>
                </div>
                
                <div className="w-12 h-0.5 bg-gray-300" />
                
                <div className={`flex items-center ${currentStep === "wines" ? "text-wine" : currentStep === "rounds" ? "text-gray-600" : "text-gray-400"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "wines" ? "bg-wine text-white" : currentStep === "rounds" ? "bg-gray-600 text-white" : "bg-gray-200"}`}>
                    3
                  </div>
                  <span className="ml-2 font-medium">Wine List</span>
                </div>
                
                <div className="w-12 h-0.5 bg-gray-300" />
                
                <div className={`flex items-center ${currentStep === "rounds" ? "text-wine" : "text-gray-400"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "rounds" ? "bg-wine text-white" : "bg-gray-200"}`}>
                    4
                  </div>
                  <span className="ml-2 font-medium">Rounds</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step content */}
        {renderStepContent()}
      </div>
    </div>
  );
}