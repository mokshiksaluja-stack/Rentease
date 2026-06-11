import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding RentEase demo database...");

  // Clean all tables in dependency order
  await prisma.report.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingTimeline.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleared all tables.");

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // ── USERS ──────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: "Admin RentEase",
      email: "admin@rentease.com",
      password: hash("Admin@123"),
      role: "ADMIN",
      isEmailVerified: true
    }
  });

  const landlord = await prisma.user.create({
    data: {
      name: "John Landlord",
      email: "landlord@rentease.com",
      password: hash("Landlord@123"),
      role: "LANDLORD",
      isEmailVerified: true
    }
  });

  const landlord2 = await prisma.user.create({
    data: {
      name: "Sarah Properties",
      email: "sarah@rentease.com",
      password: hash("Landlord@123"),
      role: "LANDLORD",
      isEmailVerified: true
    }
  });

  const tenant = await prisma.user.create({
    data: {
      name: "Jane Tenant",
      email: "tenant@rentease.com",
      password: hash("Tenant@123"),
      role: "TENANT",
      isEmailVerified: true
    }
  });

  const tenant2 = await prisma.user.create({
    data: {
      name: "Mike Renter",
      email: "mike@rentease.com",
      password: hash("Tenant@123"),
      role: "TENANT",
      isEmailVerified: true
    }
  });

  console.log("👥 Users created.");

  // ── PROPERTIES ─────────────────────────────────────────────
  const propertiesData = [
    {
      landlordId: landlord.id,
      title: "Luxury Loft in Bandra West",
      description: "A gorgeous modern loft with skyline views, high-end modular kitchen, and sleek concrete-style design. Steps from top restaurants, cafes, and Bandstand Promenade.",
      rent: 95000.00,
      bedrooms: 2,
      bathrooms: 2,
      isFurnished: true,
      address: "Carter Road",
      city: "Mumbai",
      state: "MH",
      latitude: 19.0596,
      longitude: 72.8295,
      amenities: ["WiFi", "Gym", "Pool", "Parking", "Air Conditioning"],
      isAvailable: true,
      isApproved: true,
      images: [
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
      ]
    },
    {
      landlordId: landlord.id,
      title: "Charming Beachfront Villa in ECR",
      description: "Step directly onto the sand from this fully furnished 3-bedroom beach escape on East Coast Road. Perfect for weekend retreats with stunning Bay of Bengal ocean views.",
      rent: 75000.00,
      bedrooms: 3,
      bathrooms: 3,
      isFurnished: true,
      address: "102 ECR Road",
      city: "Chennai",
      state: "TN",
      latitude: 12.9815,
      longitude: 80.2452,
      amenities: ["WiFi", "Ocean View", "Patio", "Laundry Room"],
      isAvailable: true,
      isApproved: true,
      images: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80"
      ]
    },
    {
      landlordId: landlord2.id,
      title: "Modern Studio in Indiranagar",
      description: "A sleek studio apartment in the heart of Bengaluru's most popular neighborhood. Walking distance to major breweries, metro station, and tech parks.",
      rent: 35000.00,
      bedrooms: 1,
      bathrooms: 1,
      isFurnished: true,
      address: "100 Feet Road",
      city: "Bengaluru",
      state: "KA",
      latitude: 12.9784,
      longitude: 77.6408,
      amenities: ["WiFi", "Gym", "Parking", "Air Conditioning", "Laundry Room"],
      isAvailable: true,
      isApproved: true,
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80"
      ]
    },
    {
      landlordId: landlord2.id,
      title: "Elegant Penthouse in DLF Phase 5",
      description: "A beautifully maintained 4-bedroom premium penthouse with a large private terrace, home automation, and stunning views of the city skyline. Pet-friendly.",
      rent: 120000.00,
      bedrooms: 4,
      bathrooms: 4,
      isFurnished: true,
      address: "Golf Course Road",
      city: "Gurugram",
      state: "HR",
      latitude: 28.4595,
      longitude: 77.0266,
      amenities: ["WiFi", "Parking", "Pet Friendly", "Patio", "Laundry Room"],
      isAvailable: true,
      isApproved: true,
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
      ]
    },
    {
      landlordId: landlord.id,
      title: "Cozy Apartment near Metro Station",
      description: "Contemporary 2-bed apartment in Sector 62 Noida with smart home features, close to IT parks and easily walkable to the metro.",
      rent: 25000.00,
      bedrooms: 2,
      bathrooms: 2,
      isFurnished: true,
      address: "Sector 62",
      city: "Noida",
      state: "UP",
      latitude: 28.5355,
      longitude: 77.3910,
      amenities: ["WiFi", "Gym", "Parking", "Air Conditioning"],
      isAvailable: true,
      isApproved: true,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"
      ]
    },
    {
      landlordId: landlord2.id,
      title: "Spacious Bungalow in Jubilee Hills",
      description: "Top-tier luxury bungalow with private swimming pool, lawn garden, premium marble flooring, and tight security in Hyderabad's VIP zone.",
      rent: 150000.00,
      bedrooms: 5,
      bathrooms: 5,
      isFurnished: true,
      address: "Road No 36",
      city: "Hyderabad",
      state: "TG",
      latitude: 17.4325,
      longitude: 78.4071,
      amenities: ["WiFi", "Pool", "Gym", "Parking", "Air Conditioning"],
      isAvailable: true,
      isApproved: true,
      images: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
      ]
    },
    {
      landlordId: landlord.id,
      title: "Heritage Haveli Guest Suite",
      description: "Charming heritage suite in Jaipur's C-Scheme with traditional block-print decor, antique furniture, and a quiet private inner courtyard.",
      rent: 60000.00,
      bedrooms: 2,
      bathrooms: 2,
      isFurnished: true,
      address: "C-Scheme",
      city: "Jaipur",
      state: "RJ",
      latitude: 26.9124,
      longitude: 75.7873,
      amenities: ["WiFi", "Parking", "Pet Friendly", "Laundry Room"],
      isAvailable: true,
      isApproved: true,
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
      ]
    },
    {
      landlordId: landlord2.id,
      title: "Compact Studio near DU North Campus",
      description: "Affordable and cozy 1-room studio just minutes from Delhi University North Campus. All utility bills included. Perfect for students.",
      rent: 18000.00,
      bedrooms: 1,
      bathrooms: 1,
      isFurnished: true,
      address: "Hudson Lane",
      city: "Delhi",
      state: "DL",
      latitude: 28.6961,
      longitude: 77.2155,
      amenities: ["WiFi", "Laundry Room", "Air Conditioning"],
      isAvailable: true,
      isApproved: true,
      images: [
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80"
      ]
    }
  ];

  const createdProperties = [];
  for (const { images, ...propData } of propertiesData) {
    const property = await prisma.property.create({ data: propData });
    await prisma.propertyImage.createMany({
      data: images.map((url, orderIndex) => ({ propertyId: property.id, url, orderIndex }))
    });
    createdProperties.push(property);
  }

  console.log(`🏠 ${createdProperties.length} properties created.`);

  // ── BOOKING ─────────────────────────────────────────────────
  const confirmedBooking = await prisma.booking.create({
    data: {
      bookingReference: "BK-DEMO-0001",
      propertyId: createdProperties[0].id,
      tenantId: tenant.id,
      checkIn: new Date("2026-07-01"),
      checkOut: new Date("2026-07-31"),
      totalAmount: 95000.00,
      status: "CONFIRMED",
      paymentStatus: "UNPAID",
      notes: "Early check-in requested if possible."
    }
  });

  await prisma.bookingTimeline.createMany({
    data: [
      { bookingId: confirmedBooking.id, status: "BOOKING_CREATED", note: "Booking request submitted by tenant." },
      { bookingId: confirmedBooking.id, status: "BOOKING_APPROVED", note: "Landlord approved the booking." }
    ]
  });

  // A completed + paid booking for payment history demo
  const completedBooking = await prisma.booking.create({
    data: {
      bookingReference: "BK-DEMO-0002",
      propertyId: createdProperties[1].id,
      tenantId: tenant.id,
      checkIn: new Date("2026-05-01"),
      checkOut: new Date("2026-05-31"),
      totalAmount: 75000.00,
      status: "COMPLETED",
      paymentStatus: "PAID",
    }
  });

  await prisma.payment.create({
    data: {
      bookingId: completedBooking.id,
      tenantId: tenant.id,
      landlordId: landlord.id,
      stripePaymentIntentId: "pi_sim_demo_001",
      amount: 75000.00,
      currency: "inr",
      status: "SUCCEEDED",
      paymentMethod: "CARD",
      receiptUrl: null,
      processedAt: new Date("2026-04-30"),
      idempotencyKey: "idm_demo_001"
    }
  });

  console.log("📅 Bookings & payments created.");

  // ── REVIEWS ─────────────────────────────────────────────────
  await prisma.review.create({
    data: {
      propertyId: createdProperties[0].id,
      tenantId: tenant.id,
      rating: 5,
      comment: "Absolutely stunning place! The location is great and the landlord was very responsive."
    }
  });

  await prisma.review.create({
    data: {
      propertyId: createdProperties[1].id,
      tenantId: tenant2.id,
      rating: 4,
      comment: "Beautiful beach cottage, very clean and well maintained. Would definitely return!"
    }
  });

  console.log("⭐ Reviews seeded.");

  // ── NOTIFICATIONS ───────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: tenant.id,
        type: "BOOKING_APPROVED",
        title: "Booking Approved! 🎉",
        body: "Your booking for Luxury Loft in Downtown SF has been approved by the landlord.",
        isRead: false,
        metadata: { bookingId: confirmedBooking.id }
      },
      {
        userId: landlord.id,
        type: "BOOKING_REQUEST",
        title: "New Booking Request",
        body: "Jane Tenant has requested to book your Luxury Loft in Downtown SF.",
        isRead: true,
        metadata: { bookingId: confirmedBooking.id }
      }
    ]
  });

  console.log("🔔 Notifications seeded.");

  console.log("\n✅ SEED COMPLETE!\n");
  console.log("═══════════════════════════════════");
  console.log("  Demo Login Credentials:");
  console.log("  ADMIN:    admin@rentease.com    / Admin@123");
  console.log("  LANDLORD: landlord@rentease.com / Landlord@123");
  console.log("  LANDLORD: sarah@rentease.com    / Landlord@123");
  console.log("  TENANT:   tenant@rentease.com   / Tenant@123");
  console.log("  TENANT:   mike@rentease.com     / Tenant@123");
  console.log("═══════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("💥 Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
