import { prisma } from "../config/prisma.js";

class PropertyRepository {
  /**
   * 1. Create a new property listing with nested images.
   */
  async create(propertyData, imageUrls = []) {
    return prisma.property.create({
      data: {
        ...propertyData,
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            orderIndex: index
          }))
        }
      },
      include: {
        images: true // Return images relation details in the response
      }
    });
  }

  /**
   * 2. Find a property listing by its UUID.
   */
  async findById(id) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });
  }

  /**
   * 3. Find all listings with advanced filters, sorting, and pagination.
   */
  async findAll({ where = {}, orderBy = { createdAt: "desc" }, skip = 0, take = 10 }) {
    return prisma.property.findMany({
      where,
      include: {
        images: {
          orderBy: {
            orderIndex: "asc"
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy,
      skip,
      take
    });
  }

  /**
   * Count total listings matching specific filter criteria (needed for pagination pages).
   */
  async count(where = {}) {
    return prisma.property.count({
      where
    });
  }

  /**
   * 4. Update property listing details.
   */
  async update(id, updateData, newImageUrls = []) {
    return prisma.property.update({
      where: { id },
      data: {
        ...updateData,
        // If new images are uploaded, append them to the existing images
        ...(newImageUrls.length > 0 && {
          images: {
            create: newImageUrls.map((url, index) => ({
              url,
              orderIndex: index
            }))
          }
        })
      },
      include: {
        images: true
      }
    });
  }

  /**
   * 5. Delete a property listing (deletes child images automatically via Cascade).
   */
  async delete(id) {
    return prisma.property.delete({
      where: { id }
    });
  }

  /**
   * 6. Find properties within a given radius (in km) of specific coordinates.
   * Runs the Haversine formula inside raw SQL and hydrates results using Prisma.
   */
  async findNearby(lat, lng, radiusKm) {
    // 1. Run raw SQL to find IDs and calculate spherical distances
    const rawProperties = await prisma.$queryRaw`
      SELECT id,
             (6371 * acos(
               cos(radians(${lat})) * cos(radians(latitude)) * 
               cos(radians(longitude) - radians(${lng})) + 
               sin(radians(${lat})) * sin(radians(latitude))
             )) AS distance
      FROM properties
      WHERE (6371 * acos(
               cos(radians(${lat})) * cos(radians(latitude)) * 
               cos(radians(longitude) - radians(${lng})) + 
               sin(radians(${lat})) * sin(radians(latitude))
             )) <= ${radiusKm}
      ORDER BY distance ASC
    `;

    const ids = rawProperties.map((p) => p.id);
    if (ids.length === 0) return [];

    // 2. Hydrate records using Prisma to load images and landlord details
    const properties = await prisma.property.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        images: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // 3. Re-sort the hydrated results to match the distance order calculated by Postgres
    return properties.sort((a, b) => {
      const distA = rawProperties.find((p) => p.id === a.id)?.distance || 0;
      const distB = rawProperties.find((p) => p.id === b.id)?.distance || 0;
      return distA - distB;
    });
  }
}

export const propertyRepository = new PropertyRepository();
