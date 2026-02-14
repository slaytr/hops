import { db } from "../db.js";

export interface CreateRoomOccupancyData {
  roomId: string;
  reservationId?: string;
  occupancyDate: string;
  status?: string;
  notes?: string;
}

export interface UpdateRoomOccupancyData extends Partial<CreateRoomOccupancyData> {}

export interface RoomOccupancyFilters {
  occupancyDate?: string;
  roomId?: string;
  status?: string;
}

export class RoomOccupanciesService {
  async getAll(filters: RoomOccupancyFilters = {}) {
    const { occupancyDate, roomId, status } = filters;

    const where: any = {};

    if (occupancyDate) where.occupancy_date = occupancyDate;
    if (roomId) where.room_id = roomId;
    if (status) where.status = status;

    return db.models.RoomOccupancy.findAll({
      where,
      include: [
        { model: db.models.Room, attributes: ['room_number'] },
        { model: db.models.Reservation, attributes: ['confirmation_number'] }
      ],
      order: [['occupancy_date', 'DESC'], ['created_at', 'DESC']]
    });
  }

  async getById(id: string) {
    return db.models.RoomOccupancy.findByPk(id, {
      include: [
        { model: db.models.Room, attributes: ['room_number'] },
        { model: db.models.Reservation, attributes: ['confirmation_number'] }
      ]
    });
  }

  async create(data: CreateRoomOccupancyData) {
    // Validate roomId exists
    const room = await db.models.Room.findByPk(data.roomId);
    if (!room) {
      throw new Error("Invalid room ID");
    }

    // Validate reservationId if provided
    if (data.reservationId) {
      const reservation = await db.models.Reservation.findByPk(data.reservationId);
      if (!reservation) {
        throw new Error("Invalid reservation ID");
      }
    }

    const roomOccupancy = await db.models.RoomOccupancy.create({
      room_id: data.roomId,
      reservation_id: data.reservationId || null,
      occupancy_date: data.occupancyDate,
      status: data.status as any || 'occupied',
      notes: data.notes || null
    });

    await roomOccupancy.reload({
      include: [
        { model: db.models.Room, attributes: ['room_number'] },
        { model: db.models.Reservation, attributes: ['confirmation_number'] }
      ]
    });

    return roomOccupancy;
  }

  async update(id: string, data: UpdateRoomOccupancyData) {
    const roomOccupancy = await db.models.RoomOccupancy.findByPk(id);
    if (!roomOccupancy) return null;

    // Validate roomId if provided
    if (data.roomId) {
      const room = await db.models.Room.findByPk(data.roomId);
      if (!room) {
        throw new Error("Invalid room ID");
      }
    }

    // Validate reservationId if provided
    if (data.reservationId !== undefined) {
      if (data.reservationId) {
        const reservation = await db.models.Reservation.findByPk(data.reservationId);
        if (!reservation) {
          throw new Error("Invalid reservation ID");
        }
      }
    }

    const updates: any = {};
    if (data.roomId) updates.room_id = data.roomId;
    if (data.reservationId !== undefined) updates.reservation_id = data.reservationId;
    if (data.occupancyDate) updates.occupancy_date = data.occupancyDate;
    if (data.status) updates.status = data.status;
    if (data.notes !== undefined) updates.notes = data.notes;

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await roomOccupancy.update(updates);
    await roomOccupancy.reload({
      include: [
        { model: db.models.Room, attributes: ['room_number'] },
        { model: db.models.Reservation, attributes: ['confirmation_number'] }
      ]
    });
    return roomOccupancy;
  }

  async delete(id: string) {
    const roomOccupancy = await this.getById(id);
    if (!roomOccupancy) return null;

    await roomOccupancy.destroy();
    return roomOccupancy;
  }
}

export const roomOccupanciesService = new RoomOccupanciesService();
