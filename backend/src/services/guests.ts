import { db } from "../db.js";

export interface CreateGuestData {
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  idType?: string;
  idNumber?: string;
  preferences?: Record<string, any>;
  vipStatus?: boolean;
  notes?: string;
}

export interface UpdateGuestData extends Partial<CreateGuestData> {}

export class GuestsService {
  async getAll() {
    return db.models.Guest.findAll({
      include: [{ model: db.models.User, attributes: ['email'] }],
      order: [['created_at', 'DESC']]
    });
  }

  async getById(id: string) {
    return db.models.Guest.findByPk(id, {
      include: [{ model: db.models.User, attributes: ['email'] }]
    });
  }

  async create(data: CreateGuestData) {
    // Validate userId if provided
    if (data.userId) {
      const user = await db.models.User.findByPk(data.userId);
      if (!user) {
        throw new Error("Invalid user ID");
      }
      if (user.user_type !== 'guest') {
        throw new Error("User type must be 'guest'");
      }
    }

    return db.models.Guest.create({
      user_id: data.userId || null,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone || null,
      address_line1: data.addressLine1 || null,
      address_line2: data.addressLine2 || null,
      city: data.city || null,
      state_province: data.stateProvince || null,
      postal_code: data.postalCode || null,
      country: data.country || null,
      id_type: data.idType as any || null,
      id_number: data.idNumber || null,
      preferences: data.preferences || null,
      vip_status: data.vipStatus || false,
      notes: data.notes || null
    });
  }

  async update(id: string, data: UpdateGuestData) {
    const guest = await this.getById(id);
    if (!guest) return null;

    // Validate userId if provided
    if (data.userId !== undefined && data.userId) {
      const user = await db.models.User.findByPk(data.userId);
      if (!user) {
        throw new Error("Invalid user ID");
      }
      if (user.user_type !== 'guest') {
        throw new Error("User type must be 'guest'");
      }
    }

    const updates: any = {};
    if (data.userId !== undefined) updates.user_id = data.userId || null;
    if (data.firstName) updates.first_name = data.firstName;
    if (data.lastName) updates.last_name = data.lastName;
    if (data.email) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.addressLine1 !== undefined) updates.address_line1 = data.addressLine1;
    if (data.addressLine2 !== undefined) updates.address_line2 = data.addressLine2;
    if (data.city !== undefined) updates.city = data.city;
    if (data.stateProvince !== undefined) updates.state_province = data.stateProvince;
    if (data.postalCode !== undefined) updates.postal_code = data.postalCode;
    if (data.country !== undefined) updates.country = data.country;
    if (data.idType !== undefined) updates.id_type = data.idType;
    if (data.idNumber !== undefined) updates.id_number = data.idNumber;
    if (data.preferences !== undefined) updates.preferences = data.preferences;
    if (data.vipStatus !== undefined) updates.vip_status = data.vipStatus;
    if (data.notes !== undefined) updates.notes = data.notes;

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await guest.update(updates);
    await guest.reload({ include: [{ model: db.models.User, attributes: ['email'] }] });
    return guest;
  }

  async delete(id: string) {
    const guest = await this.getById(id);
    if (!guest) return null;

    await guest.destroy();
    return guest;
  }
}

export const guestsService = new GuestsService();
