import express from "express";
import { body } from "express-validator";
import {
  getMessages,
  sendMessage,
  deleteMessage,
  markAsRead,
  uploadFile,
} from "../controllers/messageController.js";
import { authenticate } from "../middleware/auth.js";
import { upload, handleMulterError } from "../middleware/upload.js";

const router = express.Router();

const sendMessageValidation = [
  body("content").optional().isLength({ max: 1000 }).trim(),
  body("chatId").isString(),
  body("type").optional().isIn(["TEXT", "IMAGE", "FILE", "AUDIO", "VIDEO"]),
];

router.use(authenticate);

router.get("/:chatId", getMessages);
router.post("/", sendMessageValidation, sendMessage);
router.delete("/:messageId", deleteMessage);
router.put("/:messageId/read", markAsRead);

router.post("/upload", upload.single("file"), handleMulterError, uploadFile);

export default router;
