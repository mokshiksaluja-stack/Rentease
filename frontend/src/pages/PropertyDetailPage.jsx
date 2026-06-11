// RentEase Property Detail View Page
// Integrates image carousels, booking calendars, cost proration engines, and nearby alternatives conflict alerts.

import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  ShowerHead, 
  Calendar, 
  User, 
  Home, 
  Check, 
  AlertCircle,
  Play,
  Navigation,
  Star,
  Info,
  IndianRupee,
  MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api.js";
import MapComponent from "../components/MapComponent.jsx";
import { useNearbyProperties } from "../hooks/useNearbyProperties.js";
import { useBookings } from "../hooks/useBookings.js";
import { trackNearbyPropertyClick } from "../utils/analytics.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [searchRadius, setSearchRadius] = useState(15); // Configurable radius (default: 15km)
  
  // Booking Selection States
  const [checkInInput, setCheckInInput] = useState("");
  const [checkOutInput, setCheckOutInput] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");

  // 1. React Query: Fetch current property details
  const { data: property, isLoading, error } = useQuery({
    queryKey: ["property-details", id],
    queryFn: async () => {
      const response = await api.get(`/properties/${id}`);
      return response.data?.data?.property;
    }
  });

  // 2. Custom Hook: Query nearby properties based on radius selector
  const { data: nearbyProperties = [], isFetching: isLoadingNearby } = useNearbyProperties(
    property?.latitude,
    property?.longitude,
    searchRadius,
    !!property
  );

  // Instantiating hooks coordinator
  const bookingsHook = useBookings();

  // 3. Custom Hook: Fetch blocked reservation dates
  const { data: blockedDates = [] } = bookingsHook.useAvailability(id);

  // 4. Custom Hook: Create booking mutation
  const createBookingMutation = bookingsHook.useCreateBooking();

  const handleNearbyClick = (nearbyId) => {
    trackNearbyPropertyClick(nearbyId);
  };

  // Helper: Normalize Date objects for comparison
  const normalizeDateStr = (date) => new Date(date).toISOString().split("T")[0];

  // Helper: check if a selected range overlaps with blocked dates
  const dateConflict = useMemo(() => {
    if (!checkInInput || !checkOutInput) return null;

    const reqStart = new Date(checkInInput);
    const reqEnd = new Date(checkOutInput);

    if (reqStart >= reqEnd) return { message: "Check-out date must occur after check-in date" };

    // Check overlaps against each blocked range
    for (const range of blockedDates) {
      const blockedStart = new Date(range.checkIn);
      const blockedEnd = new Date(range.checkOut);

      // Overlap: reqStart < blockedEnd AND reqEnd > blockedStart
      if (reqStart < blockedEnd && reqEnd > blockedStart) {
        return {
          message: "Conflict: Selected dates overlap with an existing confirmed booking.",
          conflictRange: `${range.checkIn} to ${range.checkOut}`
        };
      }
    }
    return null;
  }, [checkInInput, checkOutInput, blockedDates]);

  // Pricing calculations
  const priceCalculation = useMemo(() => {
    if (!property || !checkInInput || !checkOutInput || dateConflict) return null;
    
    const start = new Date(checkInInput);
    const end = new Date(checkOutInput);
    const timeDiff = end.getTime() - start.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (nights <= 0) return null;

    const dailyRate = Number(property.rent) / 30;
    const subtotal = dailyRate * nights;
    const cleaningFee = 50; // Mock cleaning fee
    const serviceFee = Number((subtotal * 0.05).toFixed(2)); // Mock 5% service fee
    const total = subtotal + cleaningFee + serviceFee;

    return {
      nights,
      dailyRate: dailyRate.toFixed(2),
      subtotal: subtotal.toFixed(2),
      cleaningFee: cleaningFee.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      total: total.toFixed(2)
    };
  }, [property, checkInInput, checkOutInput, dateConflict]);

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please sign in to request a reservation");
      navigate("/auth");
      return;
    }

    if (dateConflict) {
      toast.error(dateConflict.message);
      return;
    }

    createBookingMutation.mutate({
      propertyId: id,
      checkIn: checkInInput,
      checkOut: checkOutInput,
      notes: bookingNotes
    }, {
      onSuccess: () => {
        // Clear inputs on success
        setCheckInInput("");
        setCheckOutInput("");
        setBookingNotes("");
        navigate("/dashboard/bookings");
      }
    });
  };

  const handleMessageLandlord = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to message the landlord");
      navigate("/auth");
      return;
    }
    
    if (user?.id === property.landlordId) {
      toast.error("You cannot message yourself");
      return;
    }
    
    const toastId = toast.loading("Connecting with landlord...");
    try {
      const response = await api.get("/chat/conversations");
      const conversations = response.data?.data || [];
      
      const existing = conversations.find(
        (c) => c.propertyId === property.id && c.otherUser?.id === property.landlordId
      );
      
      if (existing) {
        toast.success("Opening chat thread...", { id: toastId });
        navigate(`/dashboard/bookings?tab=messages&id=${existing.id}`);
      } else {
        const createRes = await api.post("/chat/message", {
          propertyId: property.id,
          receiverId: property.landlordId,
          message: "Hello! I am interested in your property listing: " + property.title
        });
        const newMessage = createRes.data?.data;
        if (newMessage && newMessage.conversationId) {
          toast.success("Conversation initialized!", { id: toastId });
          navigate(`/dashboard/bookings?tab=messages&id=${newMessage.conversationId}`);
        } else {
          throw new Error("Failed to initialize conversation");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to contact landlord", { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin"></div>
        <p className="text-sm text-slate-400 font-light">Loading listing details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 px-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-slate-100">Listing Not Found</h2>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          The property listing you are trying to view does not exist or has been deactivated by the landlord.
        </p>
        <Link to="/" className="btn-primary mt-4 py-2.5 px-6">
          Return to Home
        </Link>
      </div>
    );
  }

  const mediaList = property.images || [];
  const filteredNearby = nearbyProperties.filter((p) => p.id !== property.id);
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-12 space-y-8">
        
        {/* Navigation back link */}
        <Link to="/explore" className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-brand-600 transition-colors text-left">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </Link>

        {/* Title and Address Header */}
        <div className="text-left space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">{property.title}</h1>
          <div className="flex items-center space-x-1.5 text-slate-400 text-sm">
            <MapPin className="w-4 h-4 text-brand-400" />
            <span>{property.address}, {property.city}, {property.state}</span>
          </div>
        </div>

        {/* Media Showcase & Booking Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Media viewer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="h-[450px] bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-700">
              {mediaList.length > 0 ? (
                mediaList[activeMediaIndex].url.endsWith(".mp4") ? (
                  <video src={mediaList[activeMediaIndex].url} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={mediaList[activeMediaIndex].url} alt={property.title} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Home className="w-12 h-12 text-slate-700" /></div>
              )}
            </div>

            {/* Thumbnail carousel selector */}
            {mediaList.length > 1 && (
              <div className="flex items-center space-x-3 overflow-x-auto py-2">
                {mediaList.map((media, index) => (
                  <button
                    key={media.id}
                    onClick={() => setActiveMediaIndex(index)}
                    className={`w-24 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 relative transition-all ${
                      activeMediaIndex === index ? "border-brand-500 scale-95" : "border-slate-700 hover:border-slate-700"
                    }`}
                  >
                    {media.url.endsWith(".mp4") ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                        <Play className="w-4 h-4 text-white fill-white z-10" />
                        <video src={media.url} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      </div>
                    ) : (
                      <img src={media.url} alt="thumbnail" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Booking Card Widget */}
          <div className="space-y-6">
            <form onSubmit={handleBookingSubmit} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-6 text-left relative overflow-hidden">
              

              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Rent Details</span>
                <p className="text-3xl font-black text-slate-100 mt-1">
                  ₹{property.rent} <span className="text-sm font-light text-slate-400">/ month</span>
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-700">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-slate-900 rounded-lg"><Bed className="w-4 h-4 text-brand-400" /></div>
                  <div>
                    <span className="text-xs text-slate-500 block">Bedrooms</span>
                    <span className="text-sm font-semibold text-slate-200">{property.bedrooms} Bed</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-slate-900 rounded-lg"><ShowerHead className="w-4 h-4 text-brand-400" /></div>
                  <div>
                    <span className="text-xs text-slate-500 block">Bathrooms</span>
                    <span className="text-sm font-semibold text-slate-200">{property.bathrooms} Bath</span>
                  </div>
                </div>
              </div>

              {/* Calendars Selectors */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Check-in</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={checkInInput}
                      onChange={(e) => setCheckInInput(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Check-out</label>
                    <input
                      type="date"
                      min={checkInInput || todayStr}
                      value={checkOutInput}
                      onChange={(e) => setCheckOutInput(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Booking Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Special Notes / Requests</label>
                  <textarea
                    placeholder="E.g., early check-in, parking spot needed, pet request..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>
              </div>

              {/* Date Conflict Block Alert */}
              {dateConflict && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{dateConflict.message}</p>
                    {dateConflict.conflictRange && (
                      <p className="text-[10px] text-rose-600">Blocked range: {dateConflict.conflictRange}</p>
                    )}
                    <p className="text-[10px] text-slate-400 font-light">Please try selecting different dates, or scroll down to view alternative listings nearby.</p>
                  </div>
                </div>
              )}

              {/* Pricing breakdown */}
              {priceCalculation && (
                <div className="space-y-2 border-t border-slate-700 pt-4 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Rent subtotal ({priceCalculation.nights} nights)</span>
                    <span className="text-slate-100">₹{priceCalculation.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span className="text-slate-100">₹{priceCalculation.cleaningFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee (5%)</span>
                    <span className="text-slate-100">₹{priceCalculation.serviceFee}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700 pt-2 font-bold text-sm text-slate-100">
                    <span>Estimated total</span>
                    <span className="text-slate-100">₹{priceCalculation.total}</span>
                  </div>
                </div>
              )}

              {/* Submit reservation button */}
              <button
                type="submit"
                disabled={!property.isAvailable || !!dateConflict || createBookingMutation.isLoading}
                className="btn-primary w-full py-4 flex items-center justify-center space-x-2 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Calendar className="w-4 h-4" />
                <span>{createBookingMutation.isLoading ? "Submitting request..." : "Submit Reservation Request"}</span>
              </button>
            </form>

            {/* Landlord Contact Info */}
            <div className="glass-card rounded-3xl p-6 border border-slate-700 text-left flex flex-col gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 bg-brand-50 rounded-2xl"><User className="w-6 h-6 text-brand-600" /></div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Owner</span>
                  <h4 className="font-bold text-sm text-slate-200">{property.landlord?.name || "Landlord User"}</h4>
                  <span className="text-xs text-slate-400">{property.landlord?.email}</span>
                </div>
              </div>
              {user?.id !== property.landlordId && (
                <button
                  type="button"
                  onClick={handleMessageLandlord}
                  className="w-full btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700 hover:bg-slate-900 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-brand-600" />
                  <span>Message Landlord</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Listing Descriptions & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-slate-700 text-left">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-100">About this rental</h2>
              <p className="text-sm text-slate-400 leading-relaxed font-light whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-100">Offered Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="p-3 bg-slate-900/40 border border-slate-700 rounded-xl flex items-center space-x-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location Map */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">Location Map</h2>
            <div className="h-64 rounded-3xl overflow-hidden border border-slate-700 relative">
              <MapComponent properties={[property]} />
              <div className="absolute bottom-4 left-4 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] text-slate-400 z-10 shadow-sm">
                Coordinates: {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
              </div>
            </div>
          </div>

        </div>

        {/* Nearby Properties Recommendations */}
        <div className="pt-12 border-t border-slate-700 space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-brand-600 rotate-45" />
                <span>Nearby Properties</span>
              </h2>
              <p className="text-xs text-slate-500 font-light mt-1">Discover other verified properties in this neighborhood</p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-700 p-2 rounded-xl self-start sm:self-center">
              <span className="text-xs text-slate-400 font-medium pl-1">Search Radius:</span>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={25}>25 km</option>
              </select>
            </div>
          </div>

          {isLoadingNearby ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="glass-card rounded-2xl h-64 border border-slate-700 animate-pulse"></div>
              ))}
            </div>
          ) : filteredNearby.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl border border-slate-700 text-center text-slate-500 text-xs font-light">
              No adjacent properties found within {searchRadius}km of this location. Try widening the search radius!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredNearby.map((nearby) => (
                <Link
                  key={nearby.id}
                  to={`/properties/${nearby.id}`}
                  onClick={() => handleNearbyClick(nearby.id)}
                  className="glass-card glass-card-hover rounded-2xl overflow-hidden border border-slate-700 flex flex-col group"
                >
                  <div className="h-32 bg-slate-900 relative overflow-hidden">
                    {nearby.images?.[0] ? (
                      <img src={nearby.images[0].url} alt={nearby.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6 text-slate-800" /></div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-slate-900 text-brand-700 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-slate-700 shadow-sm">
                      ₹{nearby.rent}/mo
                    </span>
                  </div>

                  <div className="p-4 text-left flex-grow flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-xs text-slate-100 group-hover:text-brand-600 transition-colors line-clamp-1">{nearby.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{nearby.address}, {nearby.city}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-700 text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1"><Bed className="w-3 h-3 text-slate-500" /> <span>{nearby.bedrooms} Bed</span></span>
                      <span className="flex items-center space-x-1"><ShowerHead className="w-3 h-3 text-slate-500" /> <span>{nearby.bathrooms} Bath</span></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PropertyDetailPage;
