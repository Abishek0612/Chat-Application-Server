export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: "File upload error",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
