import {
  ChatModel,
  MessageModel,
  ChatMemberModel,
  UserModel,
} from "../models/index.js";
import { generateChatName } from "../utils/helpers.js";

export class ChatService {
  static async createDirectChat(currentUserId, targetUserId) {
    const existingChat = await ChatModel.findDirectChat(
      currentUserId,
      targetUserId
    );

    if (existingChat) {
      return existingChat;
    }

    const chatData = {
      isGroup: false,
      creatorId: currentUserId,
      members: {
        create: [
          { userId: currentUserId, role: "ADMIN" },
          { userId: targetUserId, role: "MEMBER" },
        ],
      },
    };

    return ChatModel.create(chatData);
  }

  static async createGroupChat(currentUserId, { name, description, members }) {
    const chatData = {
      name,
      description,
      isGroup: true,
      creatorId: currentUserId,
      members: {
        create: [
          { userId: currentUserId, role: "ADMIN" },
          ...members.map((memberId) => ({ userId: memberId, role: "MEMBER" })),
        ],
      },
    };

    return ChatModel.create(chatData);
  }

  static async getUserChats(userId, page = 1, limit = 20) {
    const chats = await ChatModel.findUserChats(userId, page, limit);

    return chats.map((chat) => this.formatChatForUser(chat, userId));
  }

  static async getChatById(chatId, userId) {
    const chat = await ChatModel.findByIdWithMembers(chatId);

    if (!chat) {
      throw new Error("Chat not found");
    }

    const isMember = await ChatModel.isMember(chatId, userId);
    if (!isMember) {
      throw new Error("Access denied");
    }

    return this.formatChatForUser(chat, userId);
  }

  static async addMemberToChat(chatId, userId, newMemberId, requesterUserId) {
    const isAdmin = await ChatModel.isAdmin(chatId, requesterUserId);
    if (!isAdmin) {
      throw new Error("Only admins can add members");
    }
    const isMember = await ChatModel.isMember(chatId, newMemberId);
    if (isMember) {
      throw new Error("User is already a member");
    }

    const user = await UserModel.findById(newMemberId);
    if (!user) {
      throw new Error("User not found");
    }

    return ChatMemberModel.create({
      userId: newMemberId,
      chatId,
      role: "MEMBER",
    });
  }

  static async removeMemberFromChat(chatId, memberId, requesterUserId) {
    const isAdmin = await ChatModel.isAdmin(chatId, requesterUserId);
    const isSelf = memberId === requesterUserId;

    if (!isAdmin && !isSelf) {
      throw new Error("Access denied");
    }

    return ChatMemberModel.remove(memberId, chatId);
  }

  static async updateChat(chatId, updateData, userId) {
    const isAdmin = await ChatModel.isAdmin(chatId, userId);
    if (!isAdmin) {
      throw new Error("Only admins can update chat");
    }

    return ChatModel.updateById(chatId, updateData);
  }

  static async deleteChat(chatId, userId) {
    const chat = await ChatModel.findByIdWithMembers(chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.isGroup) {
      const isAdmin = await ChatModel.isAdmin(chatId, userId);
      if (!isAdmin) {
        throw new Error("Only admins can delete group chats");
      }
    } else {
      const isMember = await ChatModel.isMember(chatId, userId);
      if (!isMember) {
        throw new Error("Access denied");
      }
    }

    return ChatModel.deleteById(chatId);
  }

  static async getChatMembers(chatId, userId) {
    const isMember = await ChatModel.isMember(chatId, userId);
    if (!isMember) {
      throw new Error("Access denied");
    }

    return ChatMemberModel.findByChat(chatId);
  }

  static async searchChats(userId, query, limit = 10) {
    const chats = await ChatModel.findUserChats(userId, 1, 100);

    return chats
      .filter((chat) => {
        const chatName = this.getChatName(chat, userId);
        return chatName.toLowerCase().includes(query.toLowerCase());
      })
      .slice(0, limit)
      .map((chat) => this.formatChatForUser(chat, userId));
  }

  static formatChatForUser(chat, currentUserId) {
    const otherMember = chat.members?.find(
      (member) => member.userId !== currentUserId
    );

    return {
      id: chat.id,
      name: this.getChatName(chat, currentUserId),
      avatar: chat.isGroup ? chat.avatar : otherMember?.user?.avatar,
      isGroup: chat.isGroup,
      description: chat.description,
      isOnline: chat.isGroup ? false : otherMember?.user?.isOnline || false,
      lastSeen: chat.isGroup ? null : otherMember?.user?.lastSeen,
      lastMessage: chat.messages?.[0] || null,
      unreadCount: chat._count?.messages || 0,
      members: chat.members || [],
      creator: chat.creator,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }

  static getChatName(chat, currentUserId) {
    if (chat.isGroup) {
      return chat.name || `Group (${chat.members?.length || 0} members)`;
    } else {
      const otherMember = chat.members?.find(
        (member) => member.userId !== currentUserId
      );
      if (otherMember?.user) {
        return `${otherMember.user.firstName} ${
          otherMember.user.lastName || ""
        }`.trim();
      }
      return "Unknown User";
    }
  }
}

export class MessageService {
  static async getChatMessages(chatId, userId, page = 1, limit = 50) {
    const isMember = await ChatModel.isMember(chatId, userId);
    if (!isMember) {
      throw new Error("Access denied");
    }

    const messages = await MessageModel.findByChatId(chatId, page, limit);

    await MessageModel.markChatMessagesAsRead(chatId, userId);

    return messages.reverse();
  }

  static async sendMessage(messageData) {
    const {
      senderId,
      chatId,
      content,
      type = "TEXT",
      receiverId,
    } = messageData;

    const isMember = await ChatModel.isMember(chatId, senderId);
    if (!isMember) {
      throw new Error("Access denied");
    }

    const message = await MessageModel.create({
      content,
      type,
      senderId,
      chatId,
      receiverId,
    });

    await ChatModel.updateById(chatId, { updatedAt: new Date() });

    return message;
  }

  static async deleteMessage(messageId, userId) {
    const message = await MessageModel.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== userId) {
      throw new Error("You can only delete your own messages");
    }

    return MessageModel.deleteById(messageId);
  }

  static async markMessageAsRead(messageId, userId) {
    const message = await MessageModel.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.receiverId !== userId) {
      throw new Error("Access denied");
    }

    return MessageModel.markAsRead(messageId);
  }

  static async getUnreadMessageCount(chatId, userId) {
    return MessageModel.getUnreadCount(chatId, userId);
  }

  static async searchMessages(chatId, userId, query, limit = 20) {
    const isMember = await ChatModel.isMember(chatId, userId);
    if (!isMember) {
      throw new Error("Access denied");
    }

    const messages = await MessageModel.findByChatId(chatId, 1, 100);

    return messages
      .filter((message) =>
        message.content.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  }
}
