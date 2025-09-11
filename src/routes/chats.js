import express from "express";
import { body } from "express-validator";
import {
  getChats,
  getChatById,
  createChat,
  updateChat,
  deleteChat,
  addChatMember,
  removeChatMember,
  getChatMembers,
} from "../controllers/chatController.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

const createChatValidation = [
  body("name").optional().isLength({ min: 1, max: 100 }).trim(),
  body("isGroup").isBoolean(),
  body("members").isArray({ min: 1 }),
  body("description").optional().isLength({ max: 500 }).trim(),
];

const updateChatValidation = [
  body("name").optional().isLength({ min: 1, max: 100 }).trim(),
  body("description").optional().isLength({ max: 500 }).trim(),
];

router.use(authenticate);

router.get("/", getChats);
router.post("/", createChatValidation, createChat);

router.get("/:chatId", getChatById);
router.put("/:chatId", updateChatValidation, updateChat);
router.delete("/:chatId", deleteChat);

router.get("/:chatId/members", getChatMembers);
router.post("/:chatId/members", addChatMember);
router.delete("/:chatId/members/:userId", removeChatMember);

router.post("/:chatId/avatar", upload.single("avatar"), updateChat);

export default router;
