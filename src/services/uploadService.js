import { cloudinary } from "../config/cloudinary.js";

const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log("Cloudinary Environment Check:", {
    hasCloudName: !!cloudName,
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    cloudName: cloudName ? `${cloudName.substring(0, 3)}...` : "missing",
    nodeEnv: process.env.NODE_ENV,
  });

  return cloudName && apiKey && apiSecret;
};

export const uploadToCloudinary = async (buffer, folder = "chat-app") => {
  console.log(`Starting Cloudinary upload to folder: ${folder}`);
  console.log(`Buffer size: ${buffer?.length || 0} bytes`);

  if (!buffer || buffer.length === 0) {
    throw new Error("No file data provided");
  }

  if (!isCloudinaryConfigured()) {
    console.error("Cloudinary configuration missing");
    throw new Error(
      "File upload service is not configured. Please contact support."
    );
  }

  try {
    console.log("Attempting Cloudinary upload...");

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: folder,
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
          ],
          timeout: 60000,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", {
              message: error.message,
              name: error.name,
              http_code: error.http_code,
            });
            reject(new Error(`Upload failed: ${error.message}`));
          } else {
            console.log("Cloudinary upload successful:", {
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              bytes: result.bytes,
            });
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(buffer);
    });

    const result = await Promise.race([
      uploadPromise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Upload timeout after 60 seconds")),
          60000
        )
      ),
    ]);

    return result;
  } catch (error) {
    console.error("Upload to Cloudinary failed:", {
      message: error.message,
      stack: error.stack,
    });

    if (error.message.includes("timeout")) {
      throw new Error("Upload timed out. Please try with a smaller file.");
    }

    if (error.message.includes("Invalid image")) {
      throw new Error(
        "Invalid image format. Please use JPEG, PNG, GIF, or WebP."
      );
    }

    throw new Error("Upload failed. Please try again later.");
  }
};
