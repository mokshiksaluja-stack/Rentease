// Custom React Query Hook for RentEase Listings search and filtering
// Implements infinite scroll pagination, cache key binds, and URL parameter triggers.

import { useInfiniteQuery } from "@tanstack/react-query";
import api from "../services/api.js";

/**
 * Custom hook wrapping search logic and paginated listings query
 * @param {Object} filters - Search parameters (city, rent, min/max price, bedrooms, bathrooms, amenities, sortBy, sortOrder)
 */
export const useProperties = (filters = {}) => {
  const fetchProperties = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams();
    params.append("page", String(pageParam));
    params.append("limit", "10"); // Page size limit
    params.append("isAvailable", "true"); // Only load active/available listings

    // Append only non-empty filters
    if (filters.search) params.append("search", filters.search);
    if (filters.city) params.append("city", filters.city);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
    if (filters.bathrooms) params.append("bathrooms", filters.bathrooms);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    
    if (filters.amenities && filters.amenities.length > 0) {
      params.append("amenities", JSON.stringify(filters.amenities));
    }

    const response = await api.get(`/properties?${params.toString()}`);
    return response.data;
  };

  // React Query Infinite scroll coordinator
  return useInfiniteQuery({
    // We bind the entire filters object inside queryKey. If any filter value changes,
    // React Query instantly re-runs the fetch operation and updates the cache.
    queryKey: ["explore-properties", filters],
    queryFn: fetchProperties,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    }
  });
};
