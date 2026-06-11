// RentEase Properties Catalog & Search Interface
// Features advanced sidebar filters, URL query param sync, debounced geocoded location, and Leaflet + OpenStreetMap split canvas.

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  Search, 
  MapPin, 
  Bed, 
  ShowerHead, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Home, 
  CheckSquare, 
  Square,
  Activity,
  AlertCircle
} from "lucide-react";
import { useProperties } from "../hooks/useProperties.js";
import { useLocationSearch } from "../hooks/useLocationSearch.js";
import MapComponent from "../components/MapComponent.jsx";
import { trackLocationSearch } from "../utils/analytics.js";

const AMENITIES_LIST = [
  "WiFi", "Gym", "Pool", "Parking", "Air Conditioning", 
  "Laundry Room", "Ocean View", "Patio", "Furnished Kitchen", "Pet Friendly"
];

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTimeoutRef = useRef(null);

  // 1. Local Input States (Synchronized with URL params)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [cityInput, setCityInput] = useState(searchParams.get("city") || "");
  
  // States used to trigger geocoding / backend queries
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [cityQuery, setCityQuery] = useState(searchParams.get("city") || "");
  
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [bathrooms, setBathrooms] = useState(searchParams.get("bathrooms") || "");
  
  // Parse amenities array from URL param
  const getInitialAmenities = () => {
    const raw = searchParams.get("amenities");
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  };
  const [selectedAmenities, setSelectedAmenities] = useState(getInitialAmenities());
  
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc");

  // Map Centering Coordinates
  const [mapCenter, setMapCenter] = useState(null);
  const [triggerGeocode, setTriggerGeocode] = useState(false);

  // 2. Custom Location Search hook (OSM Geocoding with AbortSignal)
  const { data: geocodeResult, isFetching: isGeocoding } = useLocationSearch(
    cityQuery,
    triggerGeocode
  );

  // Sync Geocode coordinate replies
  useEffect(() => {
    if (geocodeResult) {
      setMapCenter({ lat: geocodeResult.lat, lng: geocodeResult.lng });
      setTriggerGeocode(false);
      trackLocationSearch(cityQuery, 1);
    }
  }, [geocodeResult, cityQuery]);

  // 3. URL Query Parameter Sync Effect
  useEffect(() => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (cityQuery) params.city = cityQuery;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (bedrooms) params.bedrooms = bedrooms;
    if (bathrooms) params.bathrooms = bathrooms;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (selectedAmenities.length > 0) {
      params.amenities = JSON.stringify(selectedAmenities);
    }
    setSearchParams(params);
  }, [searchQuery, cityQuery, minPrice, maxPrice, bedrooms, bathrooms, selectedAmenities, sortBy, sortOrder]);



  // 5. Custom Hook query to fetch paginated listings
  const filterParams = {
    search: searchQuery,
    city: cityQuery,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    amenities: selectedAmenities,
    sortBy,
    sortOrder
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useProperties(filterParams);

  // Flatten infinite scroll pagination array
  const properties = data?.pages.flatMap((page) => page.data.properties) || [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCityQuery(cityInput);
    setTriggerGeocode(true);
  };

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === "price_asc") {
      setSortBy("rent");
      setSortOrder("asc");
    } else if (val === "price_desc") {
      setSortBy("rent");
      setSortOrder("desc");
    } else {
      setSortBy("createdAt");
      setSortOrder("desc");
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setCityInput("");
    setCityQuery("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setBathrooms("");
    setSelectedAmenities([]);
    setSortBy("createdAt");
    setSortOrder("desc");
    setMapCenter(null);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Explore Title Header */}
        <div className="text-left">
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Explore Properties</h1>
          <p className="text-sm text-slate-400 mt-1 font-light">Find and book verified properties around the state</p>
        </div>

        {/* Search Panel Bar */}
        <form onSubmit={handleSearchSubmit} className="glass-card rounded-2xl p-4 border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-500 absolute left-4" />
            <input
              type="text"
              placeholder="Search keyword (e.g. Loft, Cottage)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-200"
            />
          </div>

          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 text-slate-500 absolute left-4" />
            <input
              type="text"
              placeholder="Filter by city (e.g. Los Angeles)..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-200"
            />
            {isGeocoding && (
              <Activity className="w-4 h-4 animate-spin text-brand-500 absolute right-4" />
            )}
          </div>

          <button type="submit" className="btn-primary py-3 flex items-center justify-center space-x-2 text-sm font-semibold">
            <Search className="w-4 h-4" />
            <span>Apply Search</span>
          </button>
        </form>

        {/* Main Content Catalog Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar Filter Controls */}
          <aside className="lg:col-span-1 space-y-6 text-left">
            <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-6 sticky top-28">
              
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                  <h3 className="font-bold text-sm text-slate-200">Filters</h3>
                </div>
                <button 
                  type="button" 
                  onClick={handleResetFilters}
                  className="text-xs text-slate-500 hover:text-brand-600 transition-colors"
                >
                  Reset All
                </button>
              </div>

              {/* Price range */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Price Range (Monthly)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                  <span className="text-slate-600">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rooms Selector */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Min Bedrooms</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">Any Bedrooms</option>
                    <option value="1">1+ Bedrooms</option>
                    <option value="2">2+ Bedrooms</option>
                    <option value="3">3+ Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Min Bathrooms</label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">Any Bathrooms</option>
                    <option value="1">1+ Bathrooms</option>
                    <option value="2">2+ Bathrooms</option>
                    <option value="3">3+ Bathrooms</option>
                  </select>
                </div>
              </div>

              {/* Amenities list */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Amenities</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {AMENITIES_LIST.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => handleAmenityToggle(amenity)}
                        className="flex items-center space-x-2 text-left text-xs text-slate-400 hover:text-slate-200 transition-colors w-full"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-brand-500 flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-700 flex-shrink-0" />
                        )}
                        <span>{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </aside>

          {/* Middle Listings List */}
          <main className="lg:col-span-2 space-y-6">
            
            {/* Sort bar */}
            <div className="flex items-center justify-between text-sm text-slate-400">
              <p>Showing {properties.length} available listings</p>
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4 text-slate-500" />
                <select
                  value={`${sortBy}_${sortOrder}`}
                  onChange={handleSortChange}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="createdAt_desc">Newest First</option>
                  <option value="rent_asc">Price: Low to High</option>
                  <option value="rent_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Skeletons / Lists */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="glass-card rounded-2xl h-80 border border-slate-700 animate-pulse">
                    <div className="h-44 bg-slate-900"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                      <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="glass-card p-12 rounded-3xl border border-slate-700 text-center text-slate-400">
                <AlertCircle className="w-12 h-12 text-red-500/55 mx-auto mb-3" />
                <p>Failed to query listings. Please verify network status.</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="glass-card p-16 rounded-3xl border border-slate-700 text-center space-y-3 text-slate-400">
                <Home className="w-12 h-12 text-slate-700 mx-auto" />
                <h3 className="font-bold text-slate-200">No Listings Match Filters</h3>
                <p className="text-xs font-light max-w-xs mx-auto leading-relaxed">
                  Try adjusting price range filters, search inputs, or selecting fewer amenities.
                </p>
                <button type="button" onClick={handleResetFilters} className="btn-secondary py-2 px-4 text-xs mt-2">
                  Clear All Filters
                </button>
              </div>
            ) : (
              // Listings Grid
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.map((property) => (
                    <Link 
                      key={property.id} 
                      to={`/properties/${property.id}`} 
                      className="glass-card glass-card-hover rounded-2xl overflow-hidden border border-slate-700 flex flex-col group"
                    >
                      <div className="h-44 bg-slate-900 relative overflow-hidden">
                        {property.images?.[0] ? (
                          <img 
                            src={property.images[0].url} 
                            alt={property.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-8 h-8 text-slate-800" />
                          </div>
                        )}
                        <span className="absolute top-3 right-3 bg-brand-600/90 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg border border-brand-500/20">
                          ₹{property.rent}/mo
                        </span>
                      </div>

                      <div className="p-5 text-left flex-grow flex flex-col justify-between space-y-4">
                        <div>
                          <h4 className="font-bold text-base text-slate-200 group-hover:text-brand-400 transition-colors line-clamp-1">{property.title}</h4>
                          <span className="text-[11px] text-slate-500 block mt-0.5">{property.address}, {property.city}</span>
                          <p className="text-xs text-slate-400 font-light mt-2 line-clamp-2 leading-relaxed">{property.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-700 text-xs text-slate-400">
                          <span className="flex items-center space-x-1"><Bed className="w-3.5 h-3.5 text-slate-500" /> <span>{property.bedrooms} Bed</span></span>
                          <span className="flex items-center space-x-1"><ShowerHead className="w-3.5 h-3.5 text-slate-500" /> <span>{property.bathrooms} Bath</span></span>
                          <span className="font-semibold text-slate-500 uppercase">{property.isFurnished ? "Furnished" : "Unfurnished"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Infinite Load trigger */}
                {hasNextPage && (
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="btn-secondary w-full py-3.5 flex items-center justify-center space-x-2 text-sm font-semibold border-slate-700 hover:border-slate-700"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin text-brand-400" />
                        <span>Loading More Listings...</span>
                      </>
                    ) : (
                      <span>Load More Listings</span>
                    )}
                  </button>
                )}
              </div>
            )}
          </main>

          {/* Right Sticky Map Component */}
          <aside className="lg:col-span-1 sticky top-28 h-[calc(100vh-10rem)] hidden lg:block">
            <MapComponent properties={properties} centerCoords={mapCenter} />
          </aside>

        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
