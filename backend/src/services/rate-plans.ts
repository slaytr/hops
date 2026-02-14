import { db } from "../db.js";

export interface CreateRatePlanData {
  code: string;
  name: string;
  description?: string;
  planType?: string;
  cancellationPolicy?: string;
  minNights?: number;
  maxNights?: number;
  advanceBookingRequired?: number;
  depositPercentage?: number;
  depositRequired?: boolean;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export interface UpdateRatePlanData extends Partial<CreateRatePlanData> {}

export class RatePlansService {
  async getAll() {
    return db.models.RatePlan.findAll({
      order: [['created_at', 'DESC']]
    });
  }

  async getById(id: string) {
    return db.models.RatePlan.findByPk(id);
  }

  async create(data: CreateRatePlanData) {
    if (data.minNights !== undefined && data.minNights < 1) {
      throw new Error("Minimum nights must be at least 1");
    }

    if (data.depositPercentage !== undefined && (data.depositPercentage < 0 || data.depositPercentage > 100)) {
      throw new Error("Deposit percentage must be between 0 and 100");
    }

    return db.models.RatePlan.create({
      code: data.code,
      name: data.name,
      description: data.description || null,
      plan_type: data.planType as any || 'standard',
      cancellation_policy: data.cancellationPolicy as any || 'flexible',
      min_nights: data.minNights || 1,
      max_nights: data.maxNights || null,
      advance_booking_required: data.advanceBookingRequired || 0,
      deposit_percentage: data.depositPercentage || 0,
      deposit_required: data.depositRequired || false,
      valid_from: data.validFrom || null,
      valid_to: data.validTo || null,
      is_active: data.isActive !== undefined ? data.isActive : true
    });
  }

  async update(id: string, data: UpdateRatePlanData) {
    const ratePlan = await this.getById(id);
    if (!ratePlan) return null;

    if (data.minNights !== undefined && data.minNights < 1) {
      throw new Error("Minimum nights must be at least 1");
    }

    if (data.depositPercentage !== undefined && (data.depositPercentage < 0 || data.depositPercentage > 100)) {
      throw new Error("Deposit percentage must be between 0 and 100");
    }

    const updates: any = {};
    if (data.code) updates.code = data.code;
    if (data.name) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.planType) updates.plan_type = data.planType;
    if (data.cancellationPolicy) updates.cancellation_policy = data.cancellationPolicy;
    if (data.minNights !== undefined) updates.min_nights = data.minNights;
    if (data.maxNights !== undefined) updates.max_nights = data.maxNights;
    if (data.advanceBookingRequired !== undefined) updates.advance_booking_required = data.advanceBookingRequired;
    if (data.depositPercentage !== undefined) updates.deposit_percentage = data.depositPercentage;
    if (data.depositRequired !== undefined) updates.deposit_required = data.depositRequired;
    if (data.validFrom !== undefined) updates.valid_from = data.validFrom;
    if (data.validTo !== undefined) updates.valid_to = data.validTo;
    if (data.isActive !== undefined) updates.is_active = data.isActive;

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await ratePlan.update(updates);
    return ratePlan;
  }

  async delete(id: string) {
    const ratePlan = await this.getById(id);
    if (!ratePlan) return null;

    await ratePlan.destroy();
    return ratePlan;
  }
}

export const ratePlansService = new RatePlansService();
