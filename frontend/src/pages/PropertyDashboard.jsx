import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Home, Eye, Edit, Trash2, Check, X, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../services/api.js";

const PropertyDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. React Query: Fetch landlord's listings
  const { data, isLoading, error } = useQuery({
    queryKey: ["landlord-properties", user?.id],
    queryFn: async () => {
      const response = await api.get(`/properties?landlordId=${user?.id}`);
      return response.data?.data?.properties || [];
    },
    enabled: !!user?.id
  });

  // 2. React Query Mutation: Toggle property availability status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isAvailable }) => {
      // Find original property object to send all required fields for validation
      const property = data.find((p) => p.id === id);
      const updatedData = {
        title: property.title,
        description: property.description,
        rent: property.rent,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        isFurnished: property.isFurnished,
        address: property.address,
        city: property.city,
        state: property.state,
        latitude: property.latitude,
        longitude: property.longitude,
        amenities: property.amenities,
        isAvailable: !isAvailable // Toggle value
      };
      
      const response = await api.patch(`/properties/${id}`, updatedData);
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(["landlord-properties"]);
      toast.success("Property availability updated");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update property status");
    }
  });

  // 3. React Query Mutation: Delete property listing
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["landlord-properties"]);
      toast.success("Listing deleted successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete listing");
    }
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to permanently delete this property listing?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin"></div>
        <p className="text-sm text-slate-400">Loading your property listings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold text-slate-100">Property Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1 font-light">
            Manage your rental listings and monitor tenant availability
          </p>
        </div>
        <Link to="/admin" className="hidden" /> {/* react-router-dom reference */}
        <Link to="/properties/create" className="btn-primary flex items-center justify-center space-x-2 py-3">
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </Link>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-700 text-left">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Listings</span>
          <h3 className="text-3xl font-extrabold mt-1 text-slate-100">{data?.length || 0}</h3>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-700 text-left">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Listings</span>
          <h3 className="text-3xl font-extrabold mt-1 text-emerald-400">
            {data?.filter((p) => p.isAvailable).length || 0}
          </h3>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-slate-700 text-left">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Occupied Listings</span>
          <h3 className="text-3xl font-extrabold mt-1 text-brand-400">
            {data?.filter((p) => !p.isAvailable).length || 0}
          </h3>
        </div>
      </div>

      {/* Listings Grid */}
      {data?.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-700 text-center space-y-4">
          <Home className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No Listings Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto font-light leading-relaxed">
            You don't have any properties listed on RentEase. Add your first property to start earning rental income.
          </p>
          <Link to="/properties/create" className="btn-primary inline-block py-2.5 px-6">
            List Your First Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((property) => (
            <div 
              key={property.id} 
              className="glass-card rounded-2xl overflow-hidden border border-slate-700 flex flex-col justify-between"
            >
              {/* Image Preview slot */}
              <div className="h-48 bg-slate-900 relative">
                {property.images?.[0]?.url ? (
                  <img 
                    src={property.images[0].url} 
                    alt={property.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-8 h-8 text-slate-700" />
                  </div>
                )}
                {/* Status overlay badge */}
                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold shadow-md ${
                  property.isAvailable 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : "bg-slate-950/70 text-slate-400 border border-slate-700"
                }`}>
                  {property.isAvailable ? "Available" : "Rented / Unavailable"}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 text-left space-y-4 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-lg text-slate-100 line-clamp-1">{property.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{property.address}, {property.city}</p>
                  <p className="text-sm text-slate-400 mt-3 line-clamp-2 font-light">{property.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-700 flex items-center justify-between mt-4">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Rent</span>
                    <p className="text-lg font-extrabold text-white">₹{property.rent} <span className="text-xs font-light text-slate-400">/mo</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Rooms</span>
                    <p className="text-sm text-slate-300 font-medium">{property.bedrooms} Bed • {property.bathrooms} Bath</p>
                  </div>
                </div>
              </div>

              {/* Action Panels */}
              <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-700 flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ id: property.id, isAvailable: property.isAvailable })}
                  disabled={toggleMutation.isPending}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all duration-300 ${
                    property.isAvailable
                      ? "bg-brand-600/10 border-brand-500/20 text-brand-400 hover:bg-brand-600/25"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25"
                  }`}
                  title={property.isAvailable ? "Mark as Unavailable" : "Mark as Available"}
                >
                  {property.isAvailable ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{property.isAvailable ? "Deactivate" : "Activate"}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <Link 
                    to={`/properties/${property.id}`} 
                    className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-xl transition-all"
                    title="View Listing Details"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link 
                    to={`/properties/${property.id}/edit`} 
                    className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-xl transition-all"
                    title="Edit Listing"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyDashboard;
