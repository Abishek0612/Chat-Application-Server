import express from "express";
import passport from "passport";
import { body } from "express-validator";
import {
  register,
  login,
  logout,
  getProfile,
  googleCallback,
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

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth/error" }),
    googleCallback
  );
} else {
  router.get("/google", (req, res) => {
    res.status(501).json({
      success: false,
      message: "Google OAuth is not configured on this server",
    });
  });

  router.get("/google/callback", (req, res) => {
    res.status(501).json({
      success: false,
      message: "Google OAuth is not configured on this server",
    });
  });
}

export default router;
