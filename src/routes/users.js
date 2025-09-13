import express from "express";
import { body } from "express-validator";
import {
  getUsers,
  getUserById,
  updateProfile,
  uploadAvatar,
  searchUsers,
  getUserContacts,
  addContact,
  removeContact,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";
import { upload, handleMulterError } from "../middleware/upload.js";

const router = express.Router();

const updateProfileValidation = [
  body("firstName").optional().isLength({ min: 1, max: 50 }).trim(),
  body("lastName").optional().isLength({ max: 50 }).trim(),
  body("bio").optional().isLength({ max: 200 }).trim(),
  body("phone").optional().isMobilePhone(),
];

router.use(authenticate);

router.get("/", getUsers);
router.get("/search", searchUsers);
router.get("/contacts", getUserContacts);
router.get("/:id", getUserById);

router.put("/profile", updateProfileValidation, updateProfile);
router.post(
  "/avatar",
  upload.single("avatar"),
  handleMulterError,
  uploadAvatar
);

router.post("/contacts/:userId", addContact);
router.delete("/contacts/:userId", removeContact);

router.post("/friend-request/:userId", sendFriendRequest);
router.get("/friend-requests", getFriendRequests);
router.post("/friend-request/:requestId/accept", acceptFriendRequest);
router.post("/friend-request/:requestId/reject", rejectFriendRequest);

export default router;
