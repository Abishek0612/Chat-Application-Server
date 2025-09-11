import jwt from "jsonwebtoken";
import { prisma } from "./database.js";

const connectedUsers = new Map();

export const configureSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, avatar: true, isOnline: true },
      });

      if (!user) {
        return next(new Error("Authentication error"));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`User ${socket.user.username} connected`);

    connectedUsers.set(socket.userId, socket.id);

    await prisma.user.update({
      where: { id: socket.userId },
      data: { isOnline: true },
    });

    socket.broadcast.emit("userOnline", {
      userId: socket.userId,
      isOnline: true,
    });

    socket.on("joinChat", (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on("leaveChat", (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    socket.on("sendMessage", async (data) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            type: data.type || "TEXT",
            senderId: socket.userId,
            chatId: data.chatId,
            receiverId: data.receiverId,
          },
          include: {
            sender: {
              select: { id: true, username: true, avatar: true },
            },
            receiver: {
              select: { id: true, username: true },
            },
          },
        });

        socket.to(`chat_${data.chatId}`).emit("newMessage", message);

        if (data.receiverId && connectedUsers.has(data.receiverId)) {
          const receiverSocketId = connectedUsers.get(data.receiverId);
          io.to(receiverSocketId).emit("newMessage", message);
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", (data) => {
      socket.to(`chat_${data.chatId}`).emit("userTyping", {
        userId: socket.userId,
        username: socket.user.username,
      });
    });

    socket.on("stopTyping", (data) => {
      socket.to(`chat_${data.chatId}`).emit("userStoppedTyping", {
        userId: socket.userId,
      });
    });

    socket.on("disconnect", async () => {
      console.log(`User ${socket.user.username} disconnected`);

      connectedUsers.delete(socket.userId);

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
    });
  });
};

export { connectedUsers };
