import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(" Loading environment variables...");

if (process.env.NODE_ENV !== "production") {
  const devEnvPath = path.join(__dirname, "../../.env.development");
  let result = dotenv.config({ path: devEnvPath });

  if (result.error) {
    console.log(" .env.development not found, trying .env");
    const envPath = path.join(__dirname, "../../.env");
    result = dotenv.config({ path: envPath });

    if (result.error) {
      console.error(" No .env file found!");
      console.error("Please create a .env file in the server directory");

      process.env.DATABASE_URL = "file:./dev.db";
      process.env.JWT_SECRET = "default-jwt-secret";
      process.env.SESSION_SECRET = "default-session-secret";
      process.env.CLIENT_URL = "http://localhost:3000";
      process.env.BASE_URL = "http://localhost:5000";
      console.log("🔧 Using default environment values");
    } else {
      console.log(" .env file loaded successfully");
    }
  } else {
    console.log(" .env.development file loaded successfully");
  }
} else {
  dotenv.config();
  console.log("Production environment loaded");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
  BASE_URL: process.env.BASE_URL,
};
