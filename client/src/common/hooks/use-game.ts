import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { GameResponse } from "@shared/types";

export function useGame<T = GameResponse>(gameId: string, options?: UseQueryOptions<T, Error>) {
  return useQuery<T, Error>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
    refetchInterval: 1000, // Check every second until we get data
    retry: 5, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 1000 * 5, // Data is fresh for 5 seconds
    ...options,
  });
}
