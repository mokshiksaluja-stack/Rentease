// RentEase FrontEnd Analytics Tracking Utility
// This file centralizes user behavior events, allowing easy integration with PostHog, Mixpanel, or GA.

const isProduction = import.meta.env.PROD;

/**
 * Log analytics event to appropriate tracker (console or external API)
 */
const sendEvent = (eventName, properties = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const payload = { eventName, properties, timestamp, environment: isProduction ? "production" : "development" };
    
    // In development mode, we output events in beautiful styled console blocks
    if (!isProduction) {
      console.log(
        `%c📊 [RentEase Analytics]: ${eventName}`,
        "color: #6366f1; font-weight: bold; background: #1e1b4b; padding: 2px 6px; border-radius: 4px;",
        properties
      );
    } else {
      // Future integration hook: e.g. window.mixpanel.track(eventName, properties)
      // or window.gtag("event", eventName, properties)
    }
  } catch (err) {
    console.error("Failed to process analytics event:", err);
  }
};

/**
 * Track user clicking a specific property pricing marker on the map
 */
export const trackMarkerClick = (propertyId) => {
  sendEvent("property_marker_clicked", { propertyId });
};

/**
 * Track user clicking a map coordinate cluster
 */
export const trackClusterClick = (clusterId, size) => {
  sendEvent("cluster_clicked", { clusterId, size });
};

/**
 * Track location search updates
 */
export const trackLocationSearch = (query, resultCount) => {
  sendEvent("location_search", { query, resultsFound: resultCount });
};

/**
 * Track user clicking a nearby property card on a details page
 */
export const trackNearbyPropertyClick = (propertyId) => {
  sendEvent("nearby_property_clicked", { propertyId });
};
