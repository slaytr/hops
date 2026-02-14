import { db } from "../db.js";

export interface CreateRoomTypeData {
  name: string;
  description?: string;
  baseRate: number;
  maxOccupancy: number;
  amenities?: string[];
  status?: string;
}

export interface UpdateRoomTypeData extends Partial<CreateRoomTypeData> {}

export class RoomTypesService {
  async getAll() {
    return db.models.RoomType.findAll({
      order: [['createdAt', 'DESC']]
    });
  }

  async getById(id: string) {
    return db.models.RoomType.findByPk(id);
  }

  async create(data: CreateRoomTypeData) {
    if (data.baseRate < 0) {
      throw new Error("Base rate must be non-negative");
    }

    if (data.maxOccupancy < 1) {
      throw new Error("Max occupancy must be at least 1");
    }

    return db.models.RoomType.create({
      name: data.name,
      description: data.description || null,
      baseRate: data.baseRate,
      maxOccupancy: data.maxOccupancy,
      amenities: data.amenities ? JSON.stringify(data.amenities) : null,
      status: data.status || 'active'
    });
  }

  async update(id: string, data: UpdateRoomTypeData) {
    const roomType = await this.getById(id);
    if (!roomType) return null;

    if (data.baseRate !== undefined && data.baseRate < 0) {
      throw new Error("Base rate must be non-negative");
    }

    if (data.maxOccupancy !== undefined && data.maxOccupancy < 1) {
      throw new Error("Max occupancy must be at least 1");
    }

    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.baseRate !== undefined) updates.baseRate = data.baseRate;
    if (data.maxOccupancy) updates.maxOccupancy = data.maxOccupancy;
    if (data.amenities !== undefined) updates.amenities = data.amenities ? JSON.stringify(data.amenities) : null;
    if (data.status) updates.status = data.status;

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await roomType.update(updates);
    return roomType;
  }

  async delete(id: string) {
    const roomType = await this.getById(id);
    if (!roomType) return null;

    await roomType.destroy();
    return roomType;
  }
}

export const roomTypesService = new RoomTypesService();
