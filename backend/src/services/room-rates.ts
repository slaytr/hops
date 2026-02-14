import { db } from "../db.js";

export interface CreateRoomRateData {
  roomTypeId: string;
  ratePlanId: string;
  rate: number;
  dayOfWeek?: string;
  extraPersonRate?: number;
  extraChildRate?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateRoomRateData extends Partial<CreateRoomRateData> {}

export class RoomRatesService {
  async getAll() {
    return db.models.RoomRate.findAll({
      include: [
        { model: db.models.RoomType, attributes: ['name'] },
        { model: db.models.RatePlan, attributes: ['code', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async getById(id: string) {
    return db.models.RoomRate.findByPk(id, {
      include: [
        { model: db.models.RoomType, attributes: ['name'] },
        { model: db.models.RatePlan, attributes: ['code', 'name'] }
      ]
    });
  }

  async create(data: CreateRoomRateData) {
    if (data.rate < 0) {
      throw new Error("Rate must be non-negative");
    }

    // Validate roomTypeId exists
    const roomType = await db.models.RoomType.findByPk(data.roomTypeId);
    if (!roomType) {
      throw new Error("Invalid room type ID");
    }

    // Validate ratePlanId exists
    const ratePlan = await db.models.RatePlan.findByPk(data.ratePlanId);
    if (!ratePlan) {
      throw new Error("Invalid rate plan ID");
    }

    const roomRate = await db.models.RoomRate.create({
      room_type_id: data.roomTypeId,
      rate_plan_id: data.ratePlanId,
      rate: data.rate,
      day_of_week: data.dayOfWeek as any || 'all',
      extra_person_rate: data.extraPersonRate || 0,
      extra_child_rate: data.extraChildRate || 0,
      effective_from: data.effectiveFrom || null,
      effective_to: data.effectiveTo || null
    });

    await roomRate.reload({
      include: [
        { model: db.models.RoomType, attributes: ['name'] },
        { model: db.models.RatePlan, attributes: ['code', 'name'] }
      ]
    });

    return roomRate;
  }

  async update(id: string, data: UpdateRoomRateData) {
    const roomRate = await db.models.RoomRate.findByPk(id);
    if (!roomRate) return null;

    if (data.rate !== undefined && data.rate < 0) {
      throw new Error("Rate must be non-negative");
    }

    // Validate roomTypeId if provided
    if (data.roomTypeId) {
      const roomType = await db.models.RoomType.findByPk(data.roomTypeId);
      if (!roomType) {
        throw new Error("Invalid room type ID");
      }
    }

    // Validate ratePlanId if provided
    if (data.ratePlanId) {
      const ratePlan = await db.models.RatePlan.findByPk(data.ratePlanId);
      if (!ratePlan) {
        throw new Error("Invalid rate plan ID");
      }
    }

    const updates: any = {};
    if (data.roomTypeId) updates.room_type_id = data.roomTypeId;
    if (data.ratePlanId) updates.rate_plan_id = data.ratePlanId;
    if (data.rate !== undefined) updates.rate = data.rate;
    if (data.dayOfWeek) updates.day_of_week = data.dayOfWeek;
    if (data.extraPersonRate !== undefined) updates.extra_person_rate = data.extraPersonRate;
    if (data.extraChildRate !== undefined) updates.extra_child_rate = data.extraChildRate;
    if (data.effectiveFrom !== undefined) updates.effective_from = data.effectiveFrom;
    if (data.effectiveTo !== undefined) updates.effective_to = data.effectiveTo;

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await roomRate.update(updates);
    await roomRate.reload({
      include: [
        { model: db.models.RoomType, attributes: ['name'] },
        { model: db.models.RatePlan, attributes: ['code', 'name'] }
      ]
    });
    return roomRate;
  }

  async delete(id: string) {
    const roomRate = await this.getById(id);
    if (!roomRate) return null;

    await roomRate.destroy();
    return roomRate;
  }
}

export const roomRatesService = new RoomRatesService();
