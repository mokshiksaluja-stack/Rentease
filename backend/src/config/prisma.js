import { PrismaClient } from "@prisma/client";

// 1. Configure logging outputs based on running environment
const isDevelopment = process.env.NODE_ENV === "development";

const prisma = new PrismaClient({
  log: isDevelopment 
    ? ["query", "error", "warn", "info"] // Show full SQL commands in dev mode for auditing queries
    : ["error"] // Silence console logs in production to optimize performance
});

// 2. Register DB connection lifecycle diagnostic logging
if (isDevelopment) {
  console.log("🔌 [Prisma Database Client]: Connection pool initialized");
}

export { prisma };
