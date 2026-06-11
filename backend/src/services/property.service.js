import { propertyRepository } from "../repositories/property.repository.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

class PropertyService {
  /**
   * 1. Create a listing. Uploads files to Cloudinary first.
   */
  async createProperty(propertyData, files = [], landlordId) {
    const imageUrls = [];

    // Loop through uploaded files and stream them to Cloudinary
    for (const file of files) {
      // Determine file type (image or video)
      const resourceType = file.mimetype.startsWith("video") ? "video" : "image";
      
      const uploadResult = await uploadToCloudinary(
        file.buffer, 
        "rentease/properties", 
        resourceType
      );
      
      imageUrls.push(uploadResult.secure_url);
    }

    // Combine property fields with landlord relationship mapping
    const finalPropertyData = {
      ...propertyData,
      landlordId
    };

    return propertyRepository.create(finalPropertyData, imageUrls);
  }

  /**
   * 2. Retrieve a listing by its UUID.
   */
  async getPropertyById(id) {
    const property = await propertyRepository.findById(id);
    if (!property) {
      const err = new Error("Property listing not found");
      err.statusCode = 404;
      throw err;
    }
    return property;
  }

  /**
   * 3. Retrieve all listings matching advanced search parameters.
   * Returns listings list along with pagination metadata.
   */
  async getAllProperties(queryParams = {}) {
    const {
      city,
      state,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      amenities,
      search,
      landlordId,
      isAvailable,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10
    } = queryParams;

    const where = {};

    // 1. Availability filter (Boolean mapping)
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === "true" || isAvailable === true;
    }

    // 2. Landlord ID filter
    if (landlordId) {
      where.landlordId = landlordId;
    }

    // 3. Location filter (Case-insensitive contains check)
    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }
    if (state) {
      where.state = { contains: state, mode: "insensitive" };
    }

    // 4. Rent Range filter
    if (minPrice || maxPrice) {
      where.rent = {};
      if (minPrice) where.rent.gte = parseFloat(minPrice);
      if (maxPrice) where.rent.lte = parseFloat(maxPrice);
    }

    // 5. Rooms filter
    if (bedrooms) {
      where.bedrooms = { gte: parseInt(bedrooms, 10) };
    }
    if (bathrooms) {
      where.bathrooms = { gte: parseInt(bathrooms, 10) };
    }

    // 6. Amenities Array intersection query
    if (amenities) {
      let amenitiesArray = [];
      if (Array.isArray(amenities)) {
        amenitiesArray = amenities;
      } else if (typeof amenities === "string") {
        try {
          amenitiesArray = JSON.parse(amenities);
        } catch {
          // If not JSON, split by comma or treat as single string
          amenitiesArray = amenities.split(",").map(a => a.trim());
        }
      }
      if (amenitiesArray.length > 0) {
        where.amenities = { hasEvery: amenitiesArray };
      }
    }

    // 7. Full-text Search filter (Matches title or description)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } }
      ];
    }

    // 8. Sorting config
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // 9. Pagination calculations
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const properties = await propertyRepository.findAll({ where, orderBy, skip, take });
    const totalResults = await propertyRepository.count(where);

    return {
      properties,
      totalResults,
      page: parseInt(page, 10),
      limit: take,
      totalPages: Math.ceil(totalResults / take)
    };
  }

  /**
   * 4. Update a listing. Verifies landlord ownership.
   */
  async updateProperty(id, updateData, files = [], landlordId) {
    // 1. Verify property exists
    const property = await this.getPropertyById(id);

    // 2. Security Check: Only the owning landlord can update the property
    if (property.landlordId !== landlordId) {
      const err = new Error("Access denied. You do not have permission to modify this listing.");
      err.statusCode = 403;
      throw err;
    }

    // 3. Upload any new files to Cloudinary
    const newImageUrls = [];
    for (const file of files) {
      const resourceType = file.mimetype.startsWith("video") ? "video" : "image";
      const uploadResult = await uploadToCloudinary(file.buffer, "rentease/properties", resourceType);
      newImageUrls.push(uploadResult.secure_url);
    }

    return propertyRepository.update(id, updateData, newImageUrls);
  }

  /**
   * 5. Delete a listing. Verifies landlord ownership.
   */
  async deleteProperty(id, landlordId) {
    // 1. Verify property exists
    const property = await this.getPropertyById(id);

    // 2. Security Check: Only the owning landlord can delete the property
    if (property.landlordId !== landlordId) {
      const err = new Error("Access denied. You do not have permission to delete this listing.");
      err.statusCode = 403;
      throw err;
    }

    await propertyRepository.delete(id);
    return true;
  }

  /**
   * 6. Find listings near a coordinates center.
   */
  async getNearbyProperties(lat, lng, radiusKm = 10) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radius = parseFloat(radiusKm);

    if (isNaN(latitude) || isNaN(longitude)) {
      const err = new Error("Latitude and longitude query parameters must be valid numbers");
      err.statusCode = 400;
      throw err;
    }

    return propertyRepository.findNearby(latitude, longitude, radius);
  }
}

export const propertyService = new PropertyService();
