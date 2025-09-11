import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL database connected successfully");
  } catch (error) {
    console.error("PostgreSQL database connection failed:", error);
    process.exit(1);
  }
};

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export { prisma };
