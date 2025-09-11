import { cloudinary } from "../config/cloudinary.js";

export const uploadToCloudinary = async (buffer, folder) => {
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
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      )
      .end(buffer);
  });
};
