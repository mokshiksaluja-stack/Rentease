// Admin DTO Layer — Sanitizes sensitive fields before sending to client

export class AdminUserDTO {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.avatar = user.avatar || null;
    this.isSuspended = user.isSuspended;
    this.isEmailVerified = user.isEmailVerified;
    this.isOnline = user.isOnline;
    this.lastSeen = user.lastSeen;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt || null;
    // Prisma _count relation aggregates
    this.bookingCount = user._count?.bookings ?? 0;
    this.propertyCount = user._count?.properties ?? 0;
    this.reviewCount = user._count?.reviews ?? 0;
  }

  static fromEntity(user) {
    if (!user) return null;
    return new AdminUserDTO(user);
  }

  static fromEntities(users) {
    if (!users) return [];
    return users.map(u => AdminUserDTO.fromEntity(u));
  }
}

export class AdminPropertyDTO {
  constructor(property) {
    this.id = property.id;
    this.title = property.title;
    this.description = property.description;
    this.rent = Number(property.rent);
    this.bedrooms = property.bedrooms;
    this.bathrooms = property.bathrooms;
    this.address = property.address;
    this.city = property.city;
    this.state = property.state;
    this.isAvailable = property.isAvailable;
    this.isApproved = property.isApproved;
    this.rejectedNote = property.rejectedNote || null;
    this.isFurnished = property.isFurnished;
    this.amenities = property.amenities || [];
    this.createdAt = property.createdAt;
    this.updatedAt = property.updatedAt;
    // First image thumbnail
    this.thumbnail = property.images?.[0]?.url || null;
    // Landlord info
    if (property.landlord) {
      this.landlord = {
        id: property.landlord.id,
        name: property.landlord.name,
        email: property.landlord.email,
        avatar: property.landlord.avatar || null
      };
    }
    // Counts
    this.bookingCount = property._count?.bookings ?? 0;
    this.reviewCount = property._count?.reviews ?? 0;
  }

  static fromEntity(property) {
    if (!property) return null;
    return new AdminPropertyDTO(property);
  }

  static fromEntities(properties) {
    if (!properties) return [];
    return properties.map(p => AdminPropertyDTO.fromEntity(p));
  }
}

export class AdminReportDTO {
  constructor(report) {
    this.id = report.id;
    this.reporterId = report.reporterId;
    this.targetType = report.targetType;
    this.targetId = report.targetId;
    this.reason = report.reason;
    this.description = report.description || null;
    this.status = report.status;
    this.resolvedAt = report.resolvedAt || null;
    this.createdAt = report.createdAt;
    if (report.reporter) {
      this.reporter = {
        id: report.reporter.id,
        name: report.reporter.name,
        email: report.reporter.email,
        avatar: report.reporter.avatar || null
      };
    }
  }

  static fromEntity(report) {
    if (!report) return null;
    return new AdminReportDTO(report);
  }

  static fromEntities(reports) {
    if (!reports) return [];
    return reports.map(r => AdminReportDTO.fromEntity(r));
  }
}
