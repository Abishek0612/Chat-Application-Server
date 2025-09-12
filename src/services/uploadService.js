import { cloudinary } from "../config/cloudinary.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(`${uploadDir}/avatars`, { recursive: true });
  fs.mkdirSync(`${uploadDir}/chat-files`, { recursive: true });
  fs.mkdirSync(`${uploadDir}/images`, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "chat-files";
    if (file.fieldname === "avatar") {
      folder = "avatars";
    } else if (file.mimetype.startsWith("image/")) {
      folder = "images";
    }
    cb(null, `${uploadDir}/${folder}`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const localUpload = multer({
  storage: localStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/x-rar-compressed",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"), false);
    }
  },
});

const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return cloudName && apiKey && apiSecret && cloudName !== "chat-app";
};

export const uploadToCloudinary = async (buffer, folder) => {
  console.log("Cloudinary config check:", {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: !!process.env.CLOUDINARY_API_KEY,
    apiSecret: !!process.env.CLOUDINARY_API_SECRET,
  });

  if (!isCloudinaryConfigured()) {
    console.error("Cloudinary configuration missing:", {
      CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
    });
    throw new Error(
      "Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
    );
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder,
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("Cloudinary upload success:", result.secure_url);
            resolve(result.secure_url);
          }
        }
      )
      .end(buffer);
  });
};

export const uploadFileLocal = async (file) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const filePath = file.path.replace(/\\/g, "/");

  return {
    fileUrl: `${baseUrl}/${filePath}`,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  };
};

export { localUpload };
