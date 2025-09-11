import { validationResult } from "express-validator";
import { prisma } from "../config/database.js";
import { uploadToCloudinary } from "../services/uploadService.js";

export const getChats = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: { userId: req.user.id },
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
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: req.user.id },
              },
            },
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: "desc" },
    });

    const formattedChats = chats.map((chat) => {
      const otherMember = chat.members.find(
        (member) => member.userId !== req.user.id
      );

      return {
        id: chat.id,
        name: chat.isGroup
          ? chat.name
          : `${otherMember?.user.firstName} ${
              otherMember?.user.lastName || ""
            }`.trim(),
        avatar: chat.isGroup ? chat.avatar : otherMember?.user.avatar,
        isGroup: chat.isGroup,
        description: chat.description,
        isOnline: chat.isGroup ? false : otherMember?.user.isOnline,
        lastSeen: chat.isGroup ? null : otherMember?.user.lastSeen,
        lastMessage: chat.messages[0] || null,
        unreadCount: chat._count.messages,
        members: chat.members,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    res.json({
      success: true,
      data: { chats: formattedChats },
    });
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
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
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const isMember = chat.members.some(
      (member) => member.userId === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const otherMember = chat.members.find(
      (member) => member.userId !== req.user.id
    );

    const formattedChat = {
      id: chat.id,
      name: chat.isGroup
        ? chat.name
        : `${otherMember?.user.firstName} ${
            otherMember?.user.lastName || ""
          }`.trim(),
      avatar: chat.isGroup ? chat.avatar : otherMember?.user.avatar,
      isGroup: chat.isGroup,
      description: chat.description,
      isOnline: chat.isGroup ? false : otherMember?.user.isOnline,
      lastSeen: chat.isGroup ? null : otherMember?.user.lastSeen,
      members: chat.members,
      creator: chat.creator,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };

    res.json({
      success: true,
      data: { chat: formattedChat },
    });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createChat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    let { name, isGroup, members, description } = req.body;

    console.log("Creating chat with data:", {
      name,
      isGroup,
      members,
      description,
    });

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Members array is required",
      });
    }

    if (!isGroup && members.length !== 1) {
      return res.status(400).json({
        success: false,
        message: "Direct chat must have exactly one other member",
      });
    }

    if (isGroup && (!name || name.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Group chat must have a name",
      });
    }

    if (!isGroup) {
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: req.user.id } } },
            { members: { some: { userId: members[0] } } },
          ],
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

      if (existingChat) {
        console.log("Chat already exists, returning existing chat");
        return res.json({
          success: true,
          message: "Chat retrieved successfully",
          data: { chat: existingChat },
        });
      }
    }

    const chatData = {
      isGroup: Boolean(isGroup),
      creatorId: req.user.id,
      members: {
        create: [
          { userId: req.user.id, role: "ADMIN" },
          ...members.map((memberId) => ({
            userId: memberId,
            role: "MEMBER",
          })),
        ],
      },
    };

    if (isGroup && name) {
      chatData.name = name.trim();
    }

    if (isGroup && description) {
      chatData.description = description.trim();
    }

    console.log("Creating chat with Prisma data:", chatData);

    const chat = await prisma.chat.create({
      data: chatData,
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

    console.log("Chat created successfully:", chat.id);

    res.status(201).json({
      success: true,
      message: "Chat created successfully",
      data: { chat },
    });
  } catch (error) {
    console.error("Create chat error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: true,
      },
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const member = chat.members.find((m) => m.userId === req.user.id);
    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update chat",
      });
    }

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined)
      updateData.description = req.body.description;

    if (req.file) {
      const avatarUrl = await uploadToCloudinary(
        req.file.buffer,
        "chat-avatars"
      );
      updateData.avatar = avatarUrl;
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: updateData,
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

    res.json({
      success: true,
      message: "Chat updated successfully",
      data: { chat: updatedChat },
    });
  } catch (error) {
    console.error("Update chat error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const member = chat.members.find((m) => m.userId === req.user.id);
    if (!member || (chat.isGroup && member.role !== "ADMIN")) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await prisma.chat.delete({
      where: { id: chatId },
    });

    res.json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getChatMembers = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
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

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const isMember = chat.members.some(
      (member) => member.userId === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: { members: chat.members },
    });
  } catch (error) {
    console.error("Get chat members error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addChatMember = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });

    if (!chat || !chat.isGroup) {
      return res.status(404).json({
        success: false,
        message: "Group chat not found",
      });
    }

    const member = chat.members.find((m) => m.userId === req.user.id);
    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can add members",
      });
    }

    const existingMember = chat.members.find((m) => m.userId === userId);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member",
      });
    }

    const newMember = await prisma.chatMember.create({
      data: {
        userId,
        chatId,
        role: "MEMBER",
      },
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
    });

    res.json({
      success: true,
      message: "Member added successfully",
      data: { member: newMember },
    });
  } catch (error) {
    console.error("Add chat member error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const removeChatMember = async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });

    if (!chat || !chat.isGroup) {
      return res.status(404).json({
        success: false,
        message: "Group chat not found",
      });
    }

    const member = chat.members.find((m) => m.userId === req.user.id);
    if (!member || (member.role !== "ADMIN" && req.user.id !== userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await prisma.chatMember.deleteMany({
      where: {
        userId,
        chatId,
      },
    });

    res.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove chat member error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
