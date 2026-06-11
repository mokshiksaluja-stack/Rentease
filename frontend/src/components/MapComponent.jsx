// RentEase Interactive Property Map — Powered by Leaflet + OpenStreetMap
// 100% free. No API key. No credit card. No account required.

import React, { useEffect, useRef } from "react";
import { MapPin, Home } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon broken paths in Vite/Webpack builds
const fixLeafletIcons = () => {
  // Dynamic import to avoid SSR issues
  import("leaflet").then((L) => {
    const Leaflet = L.default || L;
    if (Leaflet?.Icon?.Default) {
      delete Leaflet.Icon.Default.prototype._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  });
};

fixLeafletIcons();

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India center
const DEFAULT_ZOOM = 5;

const MapComponent = ({ properties = [], centerCoords = null }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize Leaflet map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
      const Leaflet = L.default || L;
      const initialLat = centerCoords?.lat ?? properties[0]?.latitude ?? DEFAULT_CENTER.lat;
      const initialLng = centerCoords?.lng ?? properties[0]?.longitude ?? DEFAULT_CENTER.lng;

      // Create map
      const map = Leaflet.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenStreetMap light-style tile layer (Voyager) — free, no key needed
      Leaflet.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Add markers for properties
      addMarkers(Leaflet, map, properties);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Only init once

  // Add/update markers when properties change
  const addMarkers = (L, map, props) => {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!props || props.length === 0) return;

    props.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      // Custom price badge marker
      const markerHtml = `
        <div style="
          background: #2563eb;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 5px rgba(0,0,0,0.15);
          border: 1.5px solid #ffffff;
          cursor: pointer;
          transform: translateX(-50%);
          position: relative;
        ">
          ₹${Number(property.rent).toLocaleString()}
          <div style="
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid #2563eb;
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: "",
        iconSize: [null, null],
        iconAnchor: [0, 30],
      });

      const marker = L.marker([property.latitude, property.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px; font-family: system-ui, sans-serif;">
            <div style="font-weight:800; font-size:13px; color:#1e293b; margin-bottom:4px; line-height:1.3">${property.title}</div>
            <div style="color:#64748b; font-size:11px; margin-bottom:6px">📍 ${property.city}, ${property.state}</div>
            <div style="display:flex; gap:8px; font-size:11px; color:#475569; margin-bottom:8px">
              <span>🛏 ${property.bedrooms} bed</span>
              <span>🚿 ${property.bathrooms} bath</span>
              ${property.isFurnished ? '<span>✅ Furnished</span>' : ''}
            </div>
            <div style="font-size:15px; font-weight:900; color:#2563eb;">₹${Number(property.rent).toLocaleString()}<span style="font-size:11px;font-weight:400;color:#94a3b8">/mo</span></div>
          </div>
        `, { maxWidth: 220 });

      markersRef.current.push(marker);
    });

    // Fit map bounds to show all markers
    if (props.length > 1) {
      const validProps = props.filter((p) => p.latitude && p.longitude);
      if (validProps.length > 0) {
        const bounds = L.latLngBounds(validProps.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      }
    }
  };

  // Re-add markers when properties list changes
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      const Leaflet = L.default || L;
      addMarkers(Leaflet, mapRef.current, properties);
    });
  }, [properties]);

  // Pan to center when user searches a city
  useEffect(() => {
    if (!mapRef.current || !centerCoords) return;
    mapRef.current.flyTo([centerCoords.lat, centerCoords.lng], 12, {
      animate: true,
      duration: 1,
    });
  }, [centerCoords]);

  if (properties.length === 0 && !centerCoords) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-700 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Home className="w-10 h-10 text-slate-400" />
        <p className="text-slate-300 text-sm">No properties to show on map</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative min-h-[400px] rounded-2xl overflow-hidden border border-slate-700">
      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%", minHeight: "400px", background: "#f8fafc" }}
      />

      {/* Property count badge */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 pointer-events-none shadow-sm">
        <MapPin className="w-3 h-3 text-brand-600" />
        <span className="text-[11px] font-semibold text-slate-100">{properties.length} listing{properties.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
};

export default React.memo(MapComponent);
