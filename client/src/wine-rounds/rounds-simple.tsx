import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import WineyHeader from "@/common/winey-header";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/common/lib/queryClient";

export default function Rounds() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, navigate] = useLocation();
  
  // Get host token from session storage
  const hostToken = gameId ? sessionStorage.getItem(`game-${gameId}-hostToken`) : null;
  
  // Fetch game data
  const { data: gameData, isLoading: gameLoading } = useQuery({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId
  });
  
  // Fetch bottles data
  const { data: bottlesData, isLoading: bottlesLoading } = useQuery({
    queryKey: [`/api/games/${gameId}/bottles`],
    enabled: !!gameId && !!hostToken,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/games/${gameId}/bottles`, undefined, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      return response.json();
    },
  });
  
  const isLoading = gameLoading || bottlesLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WineyHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!gameData || !bottlesData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WineyHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Error loading data</p>
        </div>
      </div>
    );
  }
  
  const bottles = bottlesData.bottles || [];
  const totalRounds = gameData.game?.totalRounds || 4;
  
  // Group bottles by round
  const roundsData: any[][] = Array(totalRounds).fill(null).map(() => []);
  bottles.forEach((bottle: any) => {
    if (bottle.roundIndex !== null && bottle.roundIndex !== undefined && bottle.roundIndex >= 0) {
      roundsData[bottle.roundIndex]?.push(bottle);
    }
  });
  
  const unassignedBottles = bottles.filter((b: any) => 
    b.roundIndex === null || b.roundIndex === undefined || b.roundIndex < 0
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <WineyHeader />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Organize Wines into Rounds
        </h1>
        
        {/* Display unassigned wines if any */}
        {unassignedBottles.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Unassigned Wines ({unassignedBottles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {unassignedBottles.map((bottle: any) => (
                  <div key={bottle.id} className="text-sm p-2 bg-gray-100 rounded">
                    {bottle.labelName}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Display rounds */}
        <div className="space-y-4">
          {roundsData.map((roundBottles, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>Round {index + 1} ({roundBottles.length}/{gameData.game?.bottlesPerRound || 4})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {roundBottles.map((bottle: any) => (
                    <div key={bottle.id} className="text-sm p-2 bg-gray-100 rounded">
                      {bottle.labelName}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/wine-list/${gameId}`)}
          >
            Back to Wine List
          </Button>
          
          <Button
            className="bg-wine hover:bg-wine/90"
            onClick={() => navigate(`/lobby/${gameId}`)}
          >
            Continue to Lobby
          </Button>
        </div>
      </div>
    </div>
  );
}