import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const generateChatName = (members, currentUserId) => {
  const otherMembers = members.filter(
    (member) => member.userId !== currentUserId
  );
  if (otherMembers.length === 1) {
    const user = otherMembers[0].user;
    return `${user.firstName} ${user.lastName || ""}`.trim();
  }
  return `Group (${otherMembers.length + 1} members)`;
};
