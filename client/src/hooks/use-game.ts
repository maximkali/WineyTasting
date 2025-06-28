import { useQuery } from "@tanstack/react-query";

export function useGame(gameId: string) {
  return useQuery({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
    refetchInterval: 5000, // Poll for updates every 5 seconds
  });
}
