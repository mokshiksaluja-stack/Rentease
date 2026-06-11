// Custom React Query Hook for RentEase Nearby Listings queries
// Coordinates coordinate changes and custom radius filters.

import { useQuery } from "@tanstack/react-query";
import api from "../services/api.js";

/**
 * Hook to retrieve properties within a specific radius of coordinates
 * @param {number} lat - Target center Latitude
 * @param {number} lng - Target center Longitude
 * @param {number} radius - Search radius in Kilometers
 * @param {boolean} enabled - Toggle query execution
 */
export const useNearbyProperties = (lat, lng, radius = 15, enabled = true) => {
  return useQuery({
    // We bind coordinate values and radius parameters inside queryKey
    queryKey: ["nearby-properties", lat, lng, radius],
    queryFn: async () => {
      if (!lat || !lng) return [];
      
      const response = await api.get("/properties/nearby", {
        params: {
          lat: String(lat),
          lng: String(lng),
          radius: String(radius)
        }
      });
      
      return response.data?.data?.properties || [];
    },
    // Only run if coordinates exist and query is enabled
    enabled: enabled && !!lat && !!lng
  });
};
