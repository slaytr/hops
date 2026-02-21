import bcrypt from 'bcryptjs';
import { db } from '../db.js';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async register(
    email: string,
    password: string,
    userType: 'staff' | 'guest' | 'admin' = 'staff',
  ) {
    const passwordHash = await this.hashPassword(password);
    const user = await db.models.User.create({
      email,
      passwordHash,
      userType,
      status: 'active',
    });
    return user;
  }

  async login(email: string, password: string) {
    const user = await db.models.User.findOne({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const passwordHash = user.get('passwordHash') as string | null;
    if (!passwordHash) {
      return null;
    }

    const valid = await this.verifyPassword(password, passwordHash);
    if (!valid) {
      return null;
    }

    await user.update({ lastLogin: new Date() });
    return user;
  }

  async findUserById(id: number) {
    return db.models.User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
    });
  }

  async findOrCreateOAuthUser(
    provider: 'google' | 'facebook',
    providerId: string,
    email: string,
  ): Promise<{ user: any; isNew: boolean }> {
    const providerField = provider === 'google' ? 'googleId' : 'facebookId';

    // Look up by provider ID first
    let user = await db.models.User.findOne({
      where: { [providerField]: providerId },
      attributes: { exclude: ['passwordHash'] },
    });

    if (user) {
      await user.update({ lastLogin: new Date() });
      return { user, isNew: false };
    }

    // Look up by email — attach provider ID if found
    user = await db.models.User.findOne({
      where: { email },
      attributes: { exclude: ['passwordHash'] },
    });

    if (user) {
      await user.update({ [providerField]: providerId, lastLogin: new Date() });
      return { user, isNew: false };
    }

    // Create a new user
    const newUser = await db.models.User.create({
      email,
      [providerField]: providerId,
      userType: 'guest',
      status: 'active',
      lastLogin: new Date(),
    });

    return { user: newUser, isNew: true };
  }
}

export const authService = new AuthService();
