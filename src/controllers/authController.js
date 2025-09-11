import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { prisma } from "../config/database.js";
import { generateToken, hashPassword } from "../utils/helpers.js";

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { email, username, firstName, lastName, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email or username",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user, token },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { emailOrUsername, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true },
    });

    const token = generateToken(user.id);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user.id);

    res.redirect(`${process.env.CLIENT_URL}/auth/google?token=${token}`);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(
      `${process.env.CLIENT_URL}/auth/google?error=authentication_failed`
    );
  }
};

export const logout = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        phone: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
