import { db } from "../db.js";

export interface CreateUserData {
  email: string;
  userType: string;
  status?: string;
}

export interface UpdateUserData {
  email?: string;
  userType?: string;
  status?: string;
}

export class UsersService {
  async getAll() {
    return db.models.User.findAll({
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['passwordHash'] }
    });
  }

  async getById(id: string) {
    return db.models.User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] }
    });
  }

  async create(data: CreateUserData) {
    return db.models.User.create({
      email: data.email,
      userType: data.userType,
      status: data.status || 'active'
    });
  }

  async update(id: string, data: UpdateUserData) {
    const user = await this.getById(id);
    if (!user) return null;

    const updates: any = {};
    if (data.email) updates.email = data.email;
    if (data.userType) updates.userType = data.userType;
    if (data.status) updates.status = data.status;

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await user.update(updates);
    return user;
  }

  async delete(id: string) {
    const user = await this.getById(id);
    if (!user) return null;

    await user.destroy();
    return user;
  }
}

export const usersService = new UsersService();
