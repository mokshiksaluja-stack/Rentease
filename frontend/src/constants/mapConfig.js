// Map Configuration Constants for RentEase

// Default center coords (Fallback location)
export const DEFAULT_CENTER = {
  lat: 34.0522, // Los Angeles, California as standard starting point
  lng: -118.2437
};

// Default map configurations
export const DEFAULT_ZOOM = 11;
export const MAX_ZOOM = 20;

// Clustering configurations
export const CLUSTER_RADIUS = 50; // Radius of each cluster in pixels when clustering points
export const CLUSTER_MAX_ZOOM = 14; // Max zoom level to cluster points on (stops clustering above this zoom)
