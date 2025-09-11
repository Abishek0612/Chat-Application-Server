import { validationResult } from "express-validator";
import { prisma } from "../config/database.js";
import { uploadToCloudinary } from "../services/uploadService.js";

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
          ],
          NOT: { id: req.user.id },
        }
      : { NOT: { id: req.user.id } };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isOnline: true,
          lastSeen: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { firstName, lastName, bio, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        bio,
        phone,
      },
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
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const avatarUrl = await uploadToCloudinary(req.file.buffer, "avatars");

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
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
      message: "Avatar uploaded successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { users: [] },
      });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
        NOT: { id: req.user.id },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isOnline: true,
      },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserContacts = async (req, res) => {
  try {
    const contacts = await prisma.user.findMany({
      where: {
        chatMembers: {
          some: {
            chat: {
              members: {
                some: { userId: req.user.id },
              },
            },
          },
        },
        NOT: { id: req.user.id },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
      },
      distinct: ["id"],
    });

    res.json({
      success: true,
      data: { contacts },
    });
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addContact = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot add yourself as contact",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let chat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        members: {
          every: {
            userId: { in: [req.user.id, userId] },
          },
        },
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          isGroup: false,
          creatorId: req.user.id,
          members: {
            create: [
              { userId: req.user.id, role: "ADMIN" },
              { userId: userId, role: "MEMBER" },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
            },
          },
        },
      });
    }

    res.json({
      success: true,
      message: "Contact added successfully",
      data: { chat },
    });
  } catch (error) {
    console.error("Add contact error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const removeContact = async (req, res) => {
  try {
    const { userId } = req.params;

    const chat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        members: {
          every: {
            userId: { in: [req.user.id, userId] },
          },
        },
      },
    });

    if (chat) {
      await prisma.chat.delete({
        where: { id: chat.id },
      });
    }

    res.json({
      success: true,
      message: "Contact removed successfully",
    });
  } catch (error) {
    console.error("Remove contact error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
