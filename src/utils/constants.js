export const MESSAGE_TYPES = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  FILE: "FILE",
  AUDIO: "AUDIO",
  VIDEO: "VIDEO",
};

export const USER_ROLES = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
};

export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  JOIN_CHAT: "joinChat",
  LEAVE_CHAT: "leaveChat",
  SEND_MESSAGE: "sendMessage",
  NEW_MESSAGE: "newMessage",
  TYPING: "typing",
  STOP_TYPING: "stopTyping",
  USER_ONLINE: "userOnline",
  USER_OFFLINE: "userOffline",
  USER_TYPING: "userTyping",
  USER_STOPPED_TYPING: "userStoppedTyping",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  MESSAGE_MAX_LENGTH: 1000,
  BIO_MAX_LENGTH: 200,
  FILE_MAX_SIZE: 10 * 1024 * 1024,
};

export const isValidMessageType = (type) => {
  return Object.values(MESSAGE_TYPES).includes(type);
};

export const isValidUserRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};
