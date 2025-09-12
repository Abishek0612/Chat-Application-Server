import { validationResult } from "express-validator";
import { prisma } from "../config/database.js";
import { uploadToCloudinary } from "../services/uploadService.js";

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

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

    const isMember = chat.members.some(
      (member) => member.userId === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.message.count({ where: { chatId } }),
    ]);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const {
      content,
      chatId,
      type = "TEXT",
      receiverId,
      fileUrl,
      fileName,
      fileSize,
    } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID is required",
      });
    }

    if (!content && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Message content or file is required",
      });
    }

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

    const isMember = chat.members.some(
      (member) => member.userId === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const message = await prisma.message.create({
      data: {
        content: content || "",
        type,
        senderId: req.user.id,
        chatId,
        receiverId,
        fileUrl,
        fileName,
        fileSize: fileSize ? parseInt(fileSize) : null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { message },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const isMember = message.chat.members.some(
      (member) => member.userId === userId
    );

    if (!isMember || message.senderId === userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const uploadFile = async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("File:", req.file);
    console.log("Body:", req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const folder = req.file.mimetype.startsWith("image/")
      ? "images"
      : "chat-files";

    let fileUrl;

    try {
      fileUrl = await uploadToCloudinary(req.file.buffer, folder);
      console.log("File uploaded to Cloudinary:", fileUrl);
    } catch (cloudinaryError) {
      console.error("Cloudinary upload failed:", cloudinaryError);
      return res.status(500).json({
        success: false,
        message: "File upload service not available. Please try again later.",
      });
    }

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Upload file error:", error);

    let errorMessage = "Failed to upload file";

    if (error.response?.status === 413) {
      errorMessage = "File too large. Please choose a smaller file.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};
