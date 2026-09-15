import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export class Hash {
  static async hash(plainText) {
    return await bcrypt.hash(plainText, SALT_ROUNDS);
  }

  static async compare(plainText, hashed) {
    return await bcrypt.compare(plainText, hashed);
  }
}
