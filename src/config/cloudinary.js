import { v2 as cloudinary } from "cloudinary";

export const configureCloudinary = () => {
  try {
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      console.log("Cloudinary configured successfully");
    } else {
      console.log(
        "Cloudinary credentials not provided - file uploads disabled"
      );
      console.log(
        "Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables"
      );
    }
  } catch (error) {
    console.error("Error configuring Cloudinary:", error);
  }
};

export { cloudinary };
