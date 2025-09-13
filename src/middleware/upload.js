import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const allowedFileTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
    "video/mpeg",
    "audio/mpeg",
    "audio/wav",
    "application/zip",
    "application/x-rar-compressed",
  ];

  if (
    file.fieldname === "avatar" &&
    allowedImageTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else if (
    file.fieldname === "file" &&
    allowedFileTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error("Multer error:", error);

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "File upload error",
    });
  }

  if (error && error.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};
