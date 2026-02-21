import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { Staff } from '@hops/models';

export interface CreateUserData {
  email: string;
  userType: string;
  status?: string;
  password?: string;
  // Staff fields (required when userType === 'staff')
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
}

export interface UpdateUserData {
  email?: string;
  userType?: string;
  status?: string;
  password?: string;
  // Staff fields
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
}

export class UsersService {
  async getAll() {
    return db.models.User.findAll({
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'role', 'permissions', 'status'] }]
    });
  }

  async getById(id: string) {
    return db.models.User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'role', 'permissions', 'status'] }]
    });
  }

  async create(data: CreateUserData) {
    if (!data.password) {
      throw new Error('Password is required');
    }

    if (data.userType === 'staff' && (!data.firstName || !data.lastName || !data.role)) {
      throw new Error('First name, last name, and role are required for staff users');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    let createdId: number;
    await db.transaction(async (t: any) => {
      const user = await db.models.User.create({
        email: data.email,
        userType: data.userType,
        status: data.status || 'active',
        passwordHash,
      }, { transaction: t });

      createdId = user.get('id') as number;

      if (data.userType === 'staff') {
        await db.models.Staff.create({
          userId: createdId,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          permissions: data.permissions ?? ['ops_hub'],
          status: 'active',
        }, { transaction: t });
      }
    });

    return this.getById(String(createdId!));
  }

  async update(id: string, data: UpdateUserData) {
    const user = await db.models.User.findByPk(id);
    if (!user) return null;

    const userUpdates: any = {};
    if (data.email) userUpdates.email = data.email;
    if (data.userType) userUpdates.userType = data.userType;
    if (data.status) userUpdates.status = data.status;
    if (data.password) userUpdates.passwordHash = await bcrypt.hash(data.password, 12);

    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates);
    }

    // Update linked staff record if staff fields provided
    const hasStaffFields = data.firstName !== undefined || data.lastName !== undefined ||
      data.role !== undefined || data.permissions !== undefined;

    if (hasStaffFields) {
      const staff = await db.models.Staff.findOne({ where: { userId: id } });
      if (!staff) {
        throw new Error('No linked staff record found for this user');
      }
      const staffUpdates: any = {};
      if (data.firstName !== undefined) staffUpdates.firstName = data.firstName;
      if (data.lastName !== undefined) staffUpdates.lastName = data.lastName;
      if (data.role !== undefined) staffUpdates.role = data.role;
      if (data.permissions !== undefined) staffUpdates.permissions = data.permissions;
      if (Object.keys(staffUpdates).length > 0) {
        await staff.update(staffUpdates);
      }
    }

    return this.getById(id);
  }

  async delete(id: string) {
    const user = await this.getById(id);
    if (!user) return null;

    await user.destroy();
    return user;
  }
}

export const usersService = new UsersService();
