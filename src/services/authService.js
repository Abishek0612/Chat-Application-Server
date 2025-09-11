import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthService {
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  }

  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}
