import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  logout,
  getProfile,
  googleLogin,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const registerValidation = [
  body("email").isEmail().normalizeEmail(),
  body("username").isLength({ min: 3, max: 20 }).isAlphanumeric(),
  body("firstName").isLength({ min: 1, max: 50 }).trim(),
  body("lastName").optional().isLength({ max: 50 }).trim(),
  body("password")
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const loginValidation = [
  body("emailOrUsername").isLength({ min: 1 }),
  body("password").isLength({ min: 1 }),
];

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.post("/google-login", googleLogin);

export default router;
