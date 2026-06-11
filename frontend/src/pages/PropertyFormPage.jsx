import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, X, MapPin, CheckCircle } from "lucide-react";
import api from "../services/api.js";

// 1. Zod Form Schema matching backend expectations
const formSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters long").max(100),
  description: z.string().trim().min(10, "Description must be at least 10 characters long"),
  rent: z.coerce.number().positive("Rent must be a positive number"),
  bedrooms: z.coerce.number().int().min(0, "Bedrooms cannot be negative"),
  bathrooms: z.coerce.number().int().min(0, "Bathrooms cannot be negative"),
  isFurnished: z.boolean().default(false),
  address: z.string().trim().min(5, "Address must be at least 5 characters long"),
  city: z.string().trim().min(2, "City must be at least 2 characters long"),
  state: z.string().trim().min(2, "State must be at least 2 characters long"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  amenities: z.array(z.string()).min(1, "At least one amenity is required")
});

const AMENITIES_LIST = [
  "WiFi", "Gym", "Pool", "Parking", "Air Conditioning", 
  "Laundry Room", "Ocean View", "Patio", "Furnished Kitchen", "Pet Friendly"
];

const PropertyFormPage = () => {
  const { id } = useParams(); // Exists if we are in Edit Mode
  const isEditMode = !!id;
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Initialize React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isFurnished: false,
      amenities: [],
      latitude: 37.7749, // Default to SF coordinates
      longitude: -122.4194
    }
  });

  const watchedAmenities = watch("amenities");

  // 3. React Query: Fetch existing property details (If in Edit Mode)
  const { data: existingProperty, isLoading: isFetching } = useQuery({
    queryKey: ["property-edit", id],
    queryFn: async () => {
      const response = await api.get(`/properties/${id}`);
      return response.data?.data?.property;
    },
    enabled: isEditMode
  });

  // Populate form with existing data when fetched
  useEffect(() => {
    if (isEditMode && existingProperty) {
      reset({
        title: existingProperty.title,
        description: existingProperty.description,
        rent: existingProperty.rent,
        bedrooms: existingProperty.bedrooms,
        bathrooms: existingProperty.bathrooms,
        isFurnished: existingProperty.isFurnished,
        address: existingProperty.address,
        city: existingProperty.city,
        state: existingProperty.state,
        latitude: existingProperty.latitude,
        longitude: existingProperty.longitude,
        amenities: existingProperty.amenities
      });
      // Existing images display preview fallback
      if (existingProperty.images) {
        setFilePreviews(existingProperty.images.map((img) => img.url));
      }
    }
  }, [isEditMode, existingProperty, reset]);

  // Handle local file selection previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Append to file states
    setSelectedFiles((prev) => [...prev, ...files]);
    
    // Create blob previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Checkbox amenity selection toggles
  const handleAmenityToggle = (amenity) => {
    const current = watchedAmenities || [];
    const updated = current.includes(amenity)
      ? current.filter((item) => item !== amenity)
      : [...current, amenity];
    setValue("amenities", updated);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // 4. Create FormData payload containing both files and text parameters
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("rent", String(data.rent));
      formData.append("bedrooms", String(data.bedrooms));
      formData.append("bathrooms", String(data.bathrooms));
      formData.append("isFurnished", String(data.isFurnished));
      formData.append("address", data.address);
      formData.append("city", data.city);
      formData.append("state", data.state);
      formData.append("latitude", String(data.latitude));
      formData.append("longitude", String(data.longitude));
      formData.append("amenities", JSON.stringify(data.amenities));

      // Append binary files
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      if (isEditMode) {
        await api.patch(`/properties/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Listing updated successfully");
      } else {
        await api.post("/properties", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Property listed successfully!");
      }

      queryClient.invalidateQueries(["landlord-properties"]);
      navigate("/properties"); // Redirect back to landlord dashboard
    } catch (err) {
      setSubmitError(err.message || "Failed to save listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin"></div>
        <p className="text-sm text-slate-400">Fetching listing details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Return Link */}
      <Link to="/properties" className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="text-left space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-100">
          {isEditMode ? "Edit Property Listing" : "List Your Property"}
        </h1>
        <p className="text-sm text-slate-400 font-light">
          {isEditMode ? "Update details and pictures of your listing" : "Enter listing parameters to create a public property profile"}
        </p>
      </div>

      {submitError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center space-x-2 text-xs text-red-400 mb-6 text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 text-left">
        {/* Core details card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-700 pb-3">1. Listing Overview</h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Property Title</label>
              <input
                type="text"
                placeholder="e.g. Spacious 2-Bedroom Loft in Mission District"
                {...register("title")}
                className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-sm focus:outline-none focus:border-brand-500 ${
                  errors.title ? "border-red-500/50" : "border-slate-700"
                }`}
              />
              {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Property Description</label>
              <textarea
                rows={5}
                placeholder="Tell tenants about your property features, accessibility, nearby spots, etc."
                {...register("description")}
                className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-sm focus:outline-none focus:border-brand-500 ${
                  errors.description ? "border-red-500/50" : "border-slate-700"
                }`}
              />
              {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        {/* Pricing & specifications card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-700 pb-3">2. Pricing & Specs</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Rent ($)</label>
              <input
                type="number"
                placeholder="2500"
                {...register("rent")}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.rent && <p className="text-xs text-red-400 mt-1">{errors.rent.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bedrooms</label>
              <input
                type="number"
                placeholder="2"
                {...register("bedrooms")}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.bedrooms && <p className="text-xs text-red-400 mt-1">{errors.bedrooms.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bathrooms</label>
              <input
                type="number"
                placeholder="1.5"
                {...register("bathrooms")}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.bathrooms && <p className="text-xs text-red-400 mt-1">{errors.bathrooms.message}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <input
              type="checkbox"
              id="isFurnished"
              {...register("isFurnished")}
              className="w-4 h-4 accent-brand-500 rounded border-slate-700"
            />
            <label htmlFor="isFurnished" className="text-sm font-medium text-slate-300">
              This property is fully furnished
            </label>
          </div>
        </div>

        {/* Location card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-700 pb-3">3. Location Details</h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Street Address</label>
              <input
                type="text"
                placeholder="123 Main St, Apt 4B"
                {...register("address")}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none"
              />
              {errors.address && <p className="text-xs text-red-400 mt-1">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">City</label>
                <input
                  type="text"
                  placeholder="San Francisco"
                  {...register("city")}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none"
                />
                {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">State / Province</label>
                <input
                  type="text"
                  placeholder="CA"
                  {...register("state")}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none"
                />
                {errors.state && <p className="text-xs text-red-400 mt-1">{errors.state.message}</p>}
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latitude</label>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="37.7749"
                  {...register("latitude")}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Longitude</label>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="-122.4194"
                  {...register("longitude")}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Amenities Selection card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-700 pb-3">4. Amenities & Services</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {AMENITIES_LIST.map((amenity) => {
              const isSelected = watchedAmenities?.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all duration-200 ${
                    isSelected
                      ? "bg-brand-600/10 border-brand-500/30 text-brand-400"
                      : "bg-slate-900/40 border-slate-700/80 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span>{amenity}</span>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-brand-400" />}
                </button>
              );
            })}
          </div>
          {errors.amenities && <p className="text-xs text-red-400 mt-1">{errors.amenities.message}</p>}
        </div>

        {/* File upload drag-and-drop card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-700 space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-700 pb-3">5. Photos & Videos</h3>

          <div className="space-y-4">
            {/* Drag & Drop Upload trigger */}
            <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/50 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 cursor-pointer bg-slate-900/10 transition-colors relative">
              <Upload className="w-10 h-10 text-slate-500" />
              <div className="text-center">
                <span className="text-sm font-semibold text-brand-400 hover:text-brand-300">Click to upload</span>
                <span className="text-sm text-slate-400"> or drag files here</span>
              </div>
              <p className="text-xs text-slate-500">Only images (JPEG, PNG, WEBP) and videos (MP4) allowed under 10MB.</p>
              
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            {/* Media previews list */}
            {filePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                {filePreviews.map((preview, index) => (
                  <div key={index} className="h-28 rounded-xl overflow-hidden border border-slate-700 relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Delete overlay */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-4 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
          ) : (
            <span>{isEditMode ? "Save Changes" : "Create Public Listing"}</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default PropertyFormPage;
