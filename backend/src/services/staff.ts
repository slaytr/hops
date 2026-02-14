import { db } from "../db.js";

export interface CreateStaffData {
  userId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  department?: string;
  employmentDate?: string;
  hourlyRate?: number;
  status?: string;
  notes?: string;
}

export interface UpdateStaffData extends Partial<CreateStaffData> {}

export class StaffService {
  async getAll() {
    return db.models.Staff.findAll({
      include: [{ model: db.models.User, attributes: ['email'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  async getById(id: string) {
    return db.models.Staff.findByPk(id, {
      include: [{ model: db.models.User, attributes: ['email'] }]
    });
  }

  async create(data: CreateStaffData) {
    // Validate userId if provided
    if (data.userId) {
      const user = await db.models.User.findByPk(data.userId);
      if (!user) {
        throw new Error("Invalid user ID");
      }
      if (user.userType !== 'staff') {
        throw new Error("User type must be 'staff'");
      }
    }

    return db.models.Staff.create({
      userId: data.userId || null,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      role: data.role,
      department: data.department || null,
      employmentDate: data.employmentDate || null,
      hourlyRate: data.hourlyRate || null,
      status: data.status || 'active',
      notes: data.notes || null
    });
  }

  async update(id: string, data: UpdateStaffData) {
    const staff = await this.getById(id);
    if (!staff) return null;

    // Validate userId if provided
    if (data.userId !== undefined && data.userId) {
      const user = await db.models.User.findByPk(data.userId);
      if (!user) {
        throw new Error("Invalid user ID");
      }
      if (user.userType !== 'staff') {
        throw new Error("User type must be 'staff'");
      }
    }

    const updates: any = {};
    if (data.userId !== undefined) updates.userId = data.userId || null;
    if (data.firstName) updates.firstName = data.firstName;
    if (data.lastName) updates.lastName = data.lastName;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.role) updates.role = data.role;
    if (data.department !== undefined) updates.department = data.department;
    if (data.employmentDate !== undefined) updates.employmentDate = data.employmentDate;
    if (data.hourlyRate !== undefined) updates.hourlyRate = data.hourlyRate;
    if (data.status) updates.status = data.status;
    if (data.notes !== undefined) updates.notes = data.notes;

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await staff.update(updates);
    await staff.reload({ include: [{ model: db.models.User, attributes: ['email'] }] });
    return staff;
  }

  async delete(id: string) {
    const staff = await this.getById(id);
    if (!staff) return null;

    await staff.destroy();
    return staff;
  }
}

export const staffService = new StaffService();
