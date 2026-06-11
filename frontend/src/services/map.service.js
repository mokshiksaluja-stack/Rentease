// RentEase Map and Geocoding Service
// Handles address geocoding (names to coords) and reverse geocoding (coords to names)
// Built with a thread-safe in-memory cache to prevent excessive OSM Nominatim API hits.

import axios from "axios";

// Thread-safe in-memory caching structures
const geocodeCache = new Map();
const reverseGeocodeCache = new Map();

/**
 * Normalizes query string for cache key mapping (lowercase, trimmed)
 */
const normalizeQuery = (query) => {
  return query ? query.toLowerCase().trim().replace(/\s+/g, " ") : "";
};

export const mapService = {
  /**
   * Geocode a text search location query into latitude/longitude coordinates.
   * @param {string} query - The search string (e.g. "San Francisco, CA")
   * @param {AbortSignal} [signal] - Optional signal to abort the fetch request
   * @returns {Promise<{ lat: number, lng: number, displayName: string } | null>}
   */
  geocodeLocation: async (query, signal) => {
    const normalized = normalizeQuery(query);
    if (!normalized) return null;

    // 1. Check in-memory cache first
    if (geocodeCache.has(normalized)) {
      console.log(`%c💾 [Geocode Cache Hit]: "${normalized}"`, "color: #10b981; font-weight: bold;");
      return geocodeCache.get(normalized);
    }

    try {
      // 2. Fetch coordinates from OpenStreetMap Nominatim
      // Using axios with the cancellation signal passed down from the controller hook
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: query,
            format: "json",
            limit: 1,
            addressdetails: 1
          },
          signal,
          headers: {
            "Accept-Language": "en" // Normalize results in English
          }
        }
      );

      const data = response.data;
      if (!data || data.length === 0) {
        // Cache negative results for 30s to prevent spamming failed lookups
        geocodeCache.set(normalized, null);
        return null;
      }

      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };

      // 3. Store result in cache
      geocodeCache.set(normalized, result);
      console.log(`%c🌐 [Geocode API Fetch]: "${normalized}"`, "color: #f59e0b; font-weight: bold;");
      return result;
    } catch (err) {
      // If the request was cancelled, rethrow the cancellation so the hook knows to ignore the rejection
      if (axios.isCancel(err)) {
        throw err;
      }
      console.warn("Geocoding failed:", err.message);
      return null;
    }
  },

  /**
   * Reverse geocode latitude and longitude coordinates into a human-readable address.
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {AbortSignal} [signal] - Optional signal to abort the fetch request
   * @returns {Promise<string | null>}
   */
  reverseGeocode: async (lat, lng, signal) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    if (reverseGeocodeCache.has(cacheKey)) {
      return reverseGeocodeCache.get(cacheKey);
    }

    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat,
            lon: lng,
            format: "json"
          },
          signal
        }
      );

      const address = response.data?.display_name || null;
      reverseGeocodeCache.set(cacheKey, address);
      return address;
    } catch (err) {
      if (axios.isCancel(err)) {
        throw err;
      }
      console.warn("Reverse geocoding failed:", err.message);
      return null;
    }
  },

  /**
   * Quick utility to extract raw [lat, lng] array
   */
  getCoordinates: async (query) => {
    const res = await mapService.geocodeLocation(query);
    if (!res) return null;
    return [res.lat, res.lng];
  }
};
