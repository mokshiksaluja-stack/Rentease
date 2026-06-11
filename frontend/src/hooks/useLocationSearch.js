// Custom React Query Hook for RentEase Location searches
// Integrates geocoding service queries with search validation and cancellation.

import { useQuery } from "@tanstack/react-query";
import { mapService } from "../services/map.service.js";

/**
 * Hook to geocode a search string into coordinates
 * @param {string} query - The location query string (e.g., "Chicago")
 * @param {boolean} enabled - Toggle query execution
 */
export const useLocationSearch = (query, enabled = false) => {
  return useQuery({
    // Cache query results specifically by query terms
    queryKey: ["location-search", query],
    queryFn: async ({ signal }) => {
      if (!query || query.trim().length < 2) return null;
      
      // Call the service passing along the abort signal
      return mapService.geocodeLocation(query, signal);
    },
    enabled: enabled && !!query && query.trim().length >= 2,
    staleTime: Infinity, // Geocoding data is static; keep cache fresh forever
    cacheTime: Infinity
  });
};
