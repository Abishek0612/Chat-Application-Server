import { validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import { rateLimitValidator } from "../utils/validators.js";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

export const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "");
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === "object") {
    sanitizeObject(req.params);
  }

  next();
};

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts, please try again later.",
      retryAfter: Math.round(15 * 60),
    });
  },
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many registration attempts, please try again later.",
      retryAfter: Math.round(60 * 60),
    });
  },
});

export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many messages sent, please slow down.",
      retryAfter: Math.round(60),
    });
  },
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many uploads, please try again later.",
      retryAfter: Math.round(60),
    });
  },
});

export const validateFileUpload = (allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${Math.round(
          maxSize / 1024 / 1024
        )}MB`,
      });
    }

    next();
  };
};

export const validateImageUpload = validateFileUpload(
  ["image/jpeg", "image/png", "image/gif", "image/webp"],
  5 * 1024 * 1024
);

export const validateFileUploadGeneral = validateFileUpload(
  [
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
  ],
  10 * 1024 * 1024
);

export const validateRequestSize = (maxSize) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get("Content-Length") || "0");

    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: `Request too large. Maximum size: ${Math.round(
          maxSize / 1024 / 1024
        )}MB`,
      });
    }

    next();
  };
};

export const validateChatAccess = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID is required",
      });
    }

    const hasAccess = true;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat",
      });
    }

    next();
  } catch (error) {
    console.error("Chat access validation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  next();
};

export const validateOrigin = (allowedOrigins) => {
  return (req, res, next) => {
    const origin = req.get("Origin");

    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        success: false,
        message: "Origin not allowed",
      });
    }

    next();
  };
};

export const validateContentType = (allowedTypes) => {
  return (req, res, next) => {
    const contentType = req.get("Content-Type");

    if (
      contentType &&
      !allowedTypes.some((type) => contentType.includes(type))
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid content type. Allowed: ${allowedTypes.join(", ")}`,
      });
    }

    next();
  };
};

export const validateJSON = (req, res, next) => {
  if (req.get("Content-Type")?.includes("application/json")) {
    try {
      if (req.body && typeof req.body === "string") {
        req.body = JSON.parse(req.body);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format",
      });
    }
  }

  next();
};
