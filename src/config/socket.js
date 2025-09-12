import jwt from "jsonwebtoken";
import { prisma } from "./database.js";

const connectedUsers = new Map();
const userSockets = new Map();

export const configureSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isOnline: true,
        },
      });

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (err) {
      console.error("Socket authentication error:", err);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(
      `User ${socket.user.username} connected with socket ${socket.id}`
    );

    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);
    connectedUsers.set(socket.id, socket.userId);

    await prisma.user.update({
      where: { id: socket.userId },
      data: { isOnline: true },
    });

    socket.broadcast.emit("userOnline", {
      userId: socket.userId,
      isOnline: true,
      user: socket.user,
    });

    socket.join(`user_${socket.userId}`);

    socket.on("joinChat", async (chatId) => {
      try {
        const chatMember = await prisma.chatMember.findUnique({
          where: {
            userId_chatId: {
              userId: socket.userId,
              chatId: chatId,
            },
          },
        });

        if (chatMember) {
          socket.join(`chat_${chatId}`);
          console.log(`User ${socket.userId} joined chat ${chatId}`);
        }
      } catch (error) {
        console.error("Error joining chat:", error);
      }
    });

    socket.on("leaveChat", (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    socket.on("sendMessage", async (data) => {
      try {
        console.log("Received message data:", data);

        if (!data.chatId) {
          socket.emit("error", { message: "Chat ID is required" });
          return;
        }

        if (!data.content && !data.fileUrl) {
          socket.emit("error", {
            message: "Message content or file is required",
          });
          return;
        }

        const chatMember = await prisma.chatMember.findUnique({
          where: {
            userId_chatId: {
              userId: socket.userId,
              chatId: data.chatId,
            },
          },
        });

        if (!chatMember) {
          socket.emit("error", { message: "Access denied to this chat" });
          return;
        }

        const message = await prisma.message.create({
          data: {
            content: data.content || "",
            type: data.type || "TEXT",
            senderId: socket.userId,
            chatId: data.chatId,
            receiverId: data.receiverId,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize,
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
          },
        });

        await prisma.chat.update({
          where: { id: data.chatId },
          data: { updatedAt: new Date() },
        });

        console.log("Message created:", message);

        io.to(`chat_${data.chatId}`).emit("newMessage", message);

        const chatMembers = await prisma.chatMember.findMany({
          where: { chatId: data.chatId },
          include: { user: true },
        });

        chatMembers.forEach((member) => {
          if (member.userId !== socket.userId) {
            const memberSockets = userSockets.get(member.userId);
            if (!memberSockets || memberSockets.size === 0) {
              console.log(
                `User ${member.userId} is offline, should send push notification`
              );
            } else {
              io.to(`user_${member.userId}`).emit("newMessageNotification", {
                chatId: data.chatId,
                message,
                sender: socket.user,
              });
            }
          }
        });
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", (data) => {
      socket.to(`chat_${data.chatId}`).emit("userTyping", {
        userId: socket.userId,
        username: socket.user.username,
        firstName: socket.user.firstName,
        chatId: data.chatId,
      });
    });

    socket.on("stopTyping", (data) => {
      socket.to(`chat_${data.chatId}`).emit("userStoppedTyping", {
        userId: socket.userId,
        chatId: data.chatId,
      });
    });

    socket.on("markMessageRead", async (data) => {
      try {
        await prisma.message.update({
          where: { id: data.messageId },
          data: { isRead: true },
        });

        socket.to(`chat_${data.chatId}`).emit("messageRead", {
          messageId: data.messageId,
          userId: socket.userId,
        });
      } catch (error) {
        console.error("Mark message read error:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log(
        `User ${socket.user.username} disconnected from socket ${socket.id}`
      );

      const userSocketSet = userSockets.get(socket.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);

        if (userSocketSet.size === 0) {
          userSockets.delete(socket.userId);

          await prisma.user.update({
            where: { id: socket.userId },
            data: {
              isOnline: false,
              lastSeen: new Date(),
            },
          });

          socket.broadcast.emit("userOffline", {
            userId: socket.userId,
            isOnline: false,
            lastSeen: new Date(),
          });
        }
      }

      connectedUsers.delete(socket.id);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, closing server gracefully");
    io.close(() => {
      console.log("Socket.IO server closed");
    });
  });
};

export { connectedUsers, userSockets };
