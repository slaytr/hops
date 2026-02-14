import { db } from "../db.js";

export interface CreateReservationData {
  confirmationNumber: string;
  guestId: string;
  roomId?: string;
  roomTypeId: string;
  ratePlanId: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  children?: number;
  totalRate: number;
  taxAmount?: number;
  depositPaid?: number;
  status?: string;
  specialRequests?: string;
  notes?: string;
  bookedByStaffId?: string;
}

export interface UpdateReservationData extends Partial<CreateReservationData> {
  cancelledByStaffId?: string;
  cancelledAt?: string;
}

export interface ReservationFilters {
  checkInDate?: string;
  checkOutDate?: string;
  status?: string;
  guestId?: string;
}

export class ReservationsService {
  async getAll(filters: ReservationFilters = {}) {
    const { checkInDate, checkOutDate, status, guestId } = filters;

    const where: any = {};

    if (checkInDate) where.check_in_date = checkInDate;
    if (checkOutDate) where.check_out_date = checkOutDate;
    if (status) where.status = status;
    if (guestId) where.guest_id = guestId;

    return db.models.Reservation.findAll({
      where,
      include: [
        { model: db.models.Guest, attributes: ['first_name', 'last_name', 'email'] },
        { model: db.models.Room, attributes: ['room_number'] },
        { model: db.models.RoomType, attributes: ['name'] },
        { model: db.models.RatePlan, attributes: ['code', 'name'] },
        { model: db.models.Staff, as: 'booked_by_staff', attributes: ['first_name', 'last_name'] },
        { model: db.models.Staff, as: 'cancelled_by_staff', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async getById(id: string) {
    return db.models.Reservation.findByPk(id, {
      include: [
        { model: db.models.Guest, attributes: ['first_name', 'last_name', 'email'] },
        { model: db.models.Room, attributes: ['room_number'] },
        { model: db.models.RoomType, attributes: ['name'] },
        { model: db.models.RatePlan, attributes: ['code', 'name'] },
        { model: db.models.Staff, as: 'booked_by_staff', attributes: ['first_name', 'last_name'] },
        { model: db.models.Staff, as: 'cancelled_by_staff', attributes: ['first_name', 'last_name'] }
      ]
    });
  }

  async create(data: CreateReservationData) {
    // Validate guestId exists
    const guest = await db.models.Guest.findByPk(data.guestId);
    if (!guest) {
      throw new Error("Invalid guest ID");
    }

    // Validate roomId if provided
    if (data.roomId) {
      const room = await db.models.Room.findByPk(data.roomId);
      if (!room) {
        throw new Error("Invalid room ID");
      }
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

    // Validate bookedByStaffId if provided
    if (data.bookedByStaffId) {
      const staff = await db.models.Staff.findByPk(data.bookedByStaffId);
      if (!staff) {
        throw new Error("Invalid staff ID");
      }
    }

    // Validate dates
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    if (checkOut <= checkIn) {
      throw new Error("Check-out date must be after check-in date");
    }

    const reservation = await db.models.Reservation.create({
      confirmation_number: data.confirmationNumber,
      guest_id: data.guestId,
      room_id: data.roomId || null,
      room_type_id: data.roomTypeId,
      rate_plan_id: data.ratePlanId,
      check_in_date: data.checkInDate,
      check_out_date: data.checkOutDate,
      adults: data.adults || 1,
      children: data.children || 0,
      total_rate: data.totalRate,
      tax_amount: data.taxAmount || 0,
      deposit_paid: data.depositPaid || 0,
      status: data.status as any || 'pending',
      special_requests: data.specialRequests || null,
      notes: data.notes || null,
      booked_by_staff_id: data.bookedByStaffId || null
    });

    await reservation.reload({
      include: [
        { model: db.models.Guest, attributes: ['first_name', 'last_name', 'email'] },
        { model: db.models.Room, attributes: ['room_number'] },
        { model: db.models.RoomType, attributes: ['name'] },
        { model: db.models.RatePlan, attributes: ['code', 'name'] },
        { model: db.models.Staff, as: 'booked_by_staff', attributes: ['first_name', 'last_name'] }
      ]
    });

    return reservation;
  }

  async update(id: string, data: UpdateReservationData) {
    const reservation = await db.models.Reservation.findByPk(id);
    if (!reservation) return null;

    // Validate guestId if provided
    if (data.guestId) {
      const guest = await db.models.Guest.findByPk(data.guestId);
      if (!guest) {
        throw new Error("Invalid guest ID");
      }
    }

    // Validate roomId if provided
    if (data.roomId !== undefined) {
      if (data.roomId) {
        const room = await db.models.Room.findByPk(data.roomId);
        if (!room) {
          throw new Error("Invalid room ID");
        }
      }
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

    // Validate bookedByStaffId if provided
    if (data.bookedByStaffId !== undefined && data.bookedByStaffId) {
      const staff = await db.models.Staff.findByPk(data.bookedByStaffId);
      if (!staff) {
        throw new Error("Invalid booked by staff ID");
      }
    }

    // Validate cancelledByStaffId if provided
    if (data.cancelledByStaffId !== undefined && data.cancelledByStaffId) {
      const staff = await db.models.Staff.findByPk(data.cancelledByStaffId);
      if (!staff) {
        throw new Error("Invalid cancelled by staff ID");
      }
    }

    // Validate dates if provided
    if (data.checkInDate || data.checkOutDate) {
      const checkIn = new Date(data.checkInDate || reservation.check_in_date);
      const checkOut = new Date(data.checkOutDate || reservation.check_out_date);
      if (checkOut <= checkIn) {
        throw new Error("Check-out date must be after check-in date");
      }
    }

    const updates: any = {};
    if (data.confirmationNumber) updates.confirmation_number = data.confirmationNumber;
    if (data.guestId) updates.guest_id = data.guestId;
    if (data.roomId !== undefined) updates.room_id = data.roomId;
    if (data.roomTypeId) updates.room_type_id = data.roomTypeId;
    if (data.ratePlanId) updates.rate_plan_id = data.ratePlanId;
    if (data.checkInDate) updates.check_in_date = data.checkInDate;
    if (data.checkOutDate) updates.check_out_date = data.checkOutDate;
    if (data.adults !== undefined) updates.adults = data.adults;
    if (data.children !== undefined) updates.children = data.children;
    if (data.totalRate !== undefined) updates.total_rate = data.totalRate;
    if (data.taxAmount !== undefined) updates.tax_amount = data.taxAmount;
    if (data.depositPaid !== undefined) updates.deposit_paid = data.depositPaid;
    if (data.specialRequests !== undefined) updates.special_requests = data.specialRequests;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.bookedByStaffId !== undefined) updates.booked_by_staff_id = data.bookedByStaffId;
    if (data.cancelledByStaffId !== undefined) updates.cancelled_by_staff_id = data.cancelledByStaffId;
    if (data.cancelledAt !== undefined) updates.cancelled_at = data.cancelledAt;

    if (data.status) {
      updates.status = data.status;
      // Handle status transitions
      if (data.status === 'cancelled' && !reservation.cancelled_at && !data.cancelledAt) {
        updates.cancelled_at = new Date();
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await reservation.update(updates);
    await reservation.reload({
      include: [
        { model: db.models.Guest, attributes: ['first_name', 'last_name', 'email'] },
        { model: db.models.Room, attributes: ['room_number'] },
        { model: db.models.RoomType, attributes: ['name'] },
        { model: db.models.RatePlan, attributes: ['code', 'name'] },
        { model: db.models.Staff, as: 'booked_by_staff', attributes: ['first_name', 'last_name'] },
        { model: db.models.Staff, as: 'cancelled_by_staff', attributes: ['first_name', 'last_name'] }
      ]
    });

    return reservation;
  }

  async delete(id: string) {
    const reservation = await this.getById(id);
    if (!reservation) return null;

    await reservation.destroy();
    return reservation;
  }
}

export const reservationsService = new ReservationsService();
