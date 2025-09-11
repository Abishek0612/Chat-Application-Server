import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";

import { connectDB } from "./config/database.js";
import { configureCloudinary } from "./config/cloudinary.js";
import { configurePassport } from "./config/passport.js";
import { configureSocket } from "./config/socket.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chats.js";
import messageRoutes from "./routes/messages.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(limiter);
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

await connectDB();
configureCloudinary();
configurePassport();
configureSocket(io);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
