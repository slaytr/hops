import { db } from "../db.js";

export interface CreateRoomData {
  roomNumber: string;
  roomTypeId: string;
  floor?: number;
  status?: string;
  notes?: string;
}

export interface UpdateRoomData extends Partial<CreateRoomData> {}

export class RoomsService {
  async getAll() {
    return db.models.Room.findAll({
      include: [{ model: db.models.RoomType, attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  async getById(id: string) {
    return db.models.Room.findByPk(id, {
      include: [{ model: db.models.RoomType, attributes: ['name'] }]
    });
  }

  async create(data: CreateRoomData) {
    // Validate roomTypeId exists
    const roomType = await db.models.RoomType.findByPk(data.roomTypeId);
    if (!roomType) {
      throw new Error("Invalid room type ID");
    }

    const room = await db.models.Room.create({
      roomNumber: data.roomNumber,
      roomTypeId: data.roomTypeId,
      floor: data.floor || null,
      status: data.status || 'available',
      notes: data.notes || null
    });

    await room.reload({ include: [{ model: db.models.RoomType, attributes: ['name'] }] });
    return room;
  }

  async update(id: string, data: UpdateRoomData) {
    const room = await this.getById(id);
    if (!room) return null;

    // Validate roomTypeId if provided
    if (data.roomTypeId) {
      const roomType = await db.models.RoomType.findByPk(data.roomTypeId);
      if (!roomType) {
        throw new Error("Invalid room type ID");
      }
    }

    const updates: any = {};
    if (data.roomNumber) updates.roomNumber = data.roomNumber;
    if (data.roomTypeId) updates.roomTypeId = data.roomTypeId;
    if (data.floor !== undefined) updates.floor = data.floor;
    if (data.status) updates.status = data.status;
    if (data.notes !== undefined) updates.notes = data.notes;

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await room.update(updates);
    await room.reload({ include: [{ model: db.models.RoomType, attributes: ['name'] }] });
    return room;
  }

  async delete(id: string) {
    const room = await this.getById(id);
    if (!room) return null;

    await room.destroy();
    return room;
  }
}

export const roomsService = new RoomsService();
