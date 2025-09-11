import { prisma } from "../config/database.js";

export class UserModel {
  static async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async findByUsername(username) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  static async findByEmailOrUsername(emailOrUsername) {
    return prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });
  }

  static async findById(id) {
    return prisma.user.findUnique({
      where: { id },
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
        updatedAt: true,
      },
    });
  }

  static async create(userData) {
    return prisma.user.create({
      data: userData,
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
  }

  static async updateById(id, updateData) {
    return prisma.user.update({
      where: { id },
      data: updateData,
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
        updatedAt: true,
      },
    });
  }

  static async updateOnlineStatus(id, isOnline, lastSeen = new Date()) {
    return prisma.user.update({
      where: { id },
      data: { isOnline, lastSeen },
    });
  }

  static async searchUsers(query, excludeUserId, limit = 10) {
    return prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
        NOT: { id: excludeUserId },
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
      take: limit,
    });
  }
}

export class ChatModel {
  static async findByIdWithMembers(chatId) {
    return prisma.chat.findUnique({
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
  }

  static async findUserChats(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return prisma.chat.findMany({
      where: {
        members: {
          some: { userId },
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
                senderId: { not: userId },
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
    });
  }

  static async findDirectChat(userId1, userId2) {
    return prisma.chat.findFirst({
      where: {
        isGroup: false,
        members: {
          every: {
            userId: { in: [userId1, userId2] },
          },
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

  static async create(chatData) {
    return prisma.chat.create({
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
  }

  static async updateById(chatId, updateData) {
    return prisma.chat.update({
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
  }

  static async deleteById(chatId) {
    return prisma.chat.delete({
      where: { id: chatId },
    });
  }

  static async isMember(chatId, userId) {
    const member = await prisma.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });
    return !!member;
  }

  static async isAdmin(chatId, userId) {
    const member = await prisma.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });
    return member?.role === "ADMIN";
  }
}

export class MessageModel {
  static async findByChatId(chatId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    return prisma.message.findMany({
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
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(messageData) {
    return prisma.message.create({
      data: messageData,
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
  }

  static async findById(messageId) {
    return prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  static async deleteById(messageId) {
    return prisma.message.delete({
      where: { id: messageId },
    });
  }

  static async markAsRead(messageId) {
    return prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  static async markChatMessagesAsRead(chatId, userId) {
    return prisma.message.updateMany({
      where: {
        chatId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  static async getUnreadCount(chatId, userId) {
    return prisma.message.count({
      where: {
        chatId,
        receiverId: userId,
        isRead: false,
      },
    });
  }
}

export class ChatMemberModel {
  static async create(memberData) {
    return prisma.chatMember.create({
      data: memberData,
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
  }

  static async remove(userId, chatId) {
    return prisma.chatMember.deleteMany({
      where: {
        userId,
        chatId,
      },
    });
  }

  static async findByChat(chatId) {
    return prisma.chatMember.findMany({
      where: { chatId },
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
  }

  static async updateRole(userId, chatId, role) {
    return prisma.chatMember.update({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
      data: { role },
    });
  }
}

export { prisma };
