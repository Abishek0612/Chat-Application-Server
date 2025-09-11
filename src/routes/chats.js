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
  body("name")
    .optional({ nullable: true })
    .custom((value, { req }) => {
      if (req.body.isGroup && (!value || value.trim() === "")) {
        throw new Error("Group chat must have a name");
      }
      if (value && value.length > 100) {
        throw new Error("Name must be less than 100 characters");
      }
      return true;
    }),
  body("isGroup").isBoolean().withMessage("isGroup must be a boolean"),
  body("members")
    .isArray({ min: 1 })
    .withMessage("Members array is required with at least one member"),
  body("members.*").isString().withMessage("All member IDs must be strings"),
  body("description")
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
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
