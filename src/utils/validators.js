import { body, param, query } from "express-validator";
import { MESSAGE_TYPES, USER_ROLES } from "./constants.js";

export const registerValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("username")
    .isLength({ min: 3, max: 20 })
    .isAlphanumeric()
    .withMessage(
      "Username must be 3-20 characters long and contain only letters and numbers"
    ),
  body("firstName")
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage("First name is required and must be less than 50 characters"),
  body("lastName")
    .optional()
    .isLength({ max: 50 })
    .trim()
    .escape()
    .withMessage("Last name must be less than 50 characters"),
  body("password")
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must be at least 6 characters long and contain at least one lowercase letter, one uppercase letter, and one number"
    ),
];

export const loginValidator = [
  body("emailOrUsername")
    .isLength({ min: 1 })
    .withMessage("Email or username is required"),
  body("password").isLength({ min: 1 }).withMessage("Password is required"),
];

export const updateProfileValidator = [
  body("firstName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage("First name must be 1-50 characters long"),
  body("lastName")
    .optional()
    .isLength({ max: 50 })
    .trim()
    .escape()
    .withMessage("Last name must be less than 50 characters"),
  body("bio")
    .optional()
    .isLength({ max: 200 })
    .trim()
    .escape()
    .withMessage("Bio must be less than 200 characters"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
];

export const searchUsersValidator = [
  query("q")
    .isLength({ min: 2 })
    .withMessage("Search query must be at least 2 characters long"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

export const userIdParamValidator = [
  param("id")
    .isString()
    .isLength({ min: 1 })
    .withMessage("User ID is required"),
];

export const createChatValidator = [
  body("name")
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage("Chat name must be 1-100 characters long"),
  body("isGroup").isBoolean().withMessage("isGroup must be a boolean value"),
  body("members")
    .isArray({ min: 1 })
    .withMessage("At least one member is required"),
  body("members.*")
    .isString()
    .isLength({ min: 1 })
    .withMessage("All member IDs must be valid strings"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .trim()
    .escape()
    .withMessage("Description must be less than 500 characters"),
];

export const updateChatValidator = [
  body("name")
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage("Chat name must be 1-100 characters long"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .trim()
    .escape()
    .withMessage("Description must be less than 500 characters"),
];

export const chatIdParamValidator = [
  param("chatId")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Chat ID is required"),
];

export const addMemberValidator = [
  body("userId")
    .isString()
    .isLength({ min: 1 })
    .withMessage("User ID is required"),
];

export const sendMessageValidator = [
  body("content")
    .isLength({ min: 1, max: 1000 })
    .trim()
    .withMessage(
      "Message content is required and must be less than 1000 characters"
    ),
  body("chatId")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Chat ID is required"),
  body("type")
    .optional()
    .isIn(["TEXT", "IMAGE", "FILE", "AUDIO", "VIDEO"])
    .withMessage(
      "Message type must be one of: TEXT, IMAGE, FILE, AUDIO, VIDEO"
    ),
  body("receiverId")
    .optional()
    .isString()
    .withMessage("Receiver ID must be a valid string"),
];

export const messageIdParamValidator = [
  param("messageId")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Message ID is required"),
];

export const getMessagesValidator = [
  param("chatId")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Chat ID is required"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

export const paginationValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

export const searchValidator = [
  query("search")
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage("Search query must be 2-100 characters long"),
];

export const avatarUploadValidator = [
  body("avatar").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("Avatar file is required");
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error(
        "Avatar must be a valid image file (JPEG, PNG, GIF, or WebP)"
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      throw new Error("Avatar file size must be less than 5MB");
    }

    return true;
  }),
];

export const fileUploadValidator = [
  body("file").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("File is required");
    }

    const allowedTypes = [
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
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error("File type not supported");
    }

    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      throw new Error("File size must be less than 10MB");
    }

    return true;
  }),
];

export const customValidators = {
  isValidObjectId: (value) => {
    return /^[a-zA-Z0-9]{20,}$/.test(value);
  },

  isStrongPassword: (value) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
      value
    );
  },

  isValidUsername: (value) => {
    return /^[a-zA-Z0-9_.-]{3,20}$/.test(value);
  },

  sanitizeInput: (value) => {
    return value.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  },
};

export const rateLimitValidator = {
  login: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again later.",
  },

  register: {
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: "Too many registration attempts, please try again later.",
  },

  message: {
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many messages sent, please slow down.",
  },

  upload: {
    windowMs: 60 * 1000,
    max: 5,
    message: "Too many uploads, please try again later.",
  },
};

export const sendMessageValidator = [
  body("content")
    .isLength({ min: 1, max: 1000 })
    .trim()
    .withMessage(
      "Message content is required and must be less than 1000 characters"
    ),
  body("chatId")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Chat ID is required"),
  body("type")
    .optional()
    .isIn(Object.values(MESSAGE_TYPES))
    .withMessage(
      `Message type must be one of: ${Object.values(MESSAGE_TYPES).join(", ")}`
    ),
  body("receiverId")
    .optional()
    .isString()
    .withMessage("Receiver ID must be a valid string"),
];

export const updateMemberRoleValidator = [
  body("role")
    .isIn(Object.values(USER_ROLES))
    .withMessage(
      `Role must be one of: ${Object.values(USER_ROLES).join(", ")}`
    ),
];
