import { FastifyInstance } from "fastify";
import { reservationsService, CreateReservationData, UpdateReservationData } from "../services/reservations.js";

export default async function reservationsRoutes(fastify: FastifyInstance) {
  // Get all reservations with optional filters
  fastify.get<{ Querystring: { checkInDate?: string; checkOutDate?: string; status?: string; guestId?: string } }>("/reservations", async (request) => {
    const reservations = await reservationsService.getAll(request.query);
    return { reservations };
  });

  // Get reservation by ID
  fastify.get<{ Params: { id: string } }>("/reservations/:id", async (request, reply) => {
    const reservation = await reservationsService.getById(request.params.id);

    if (!reservation) {
      return reply.status(404).send({ error: "Reservation not found" });
    }

    return { reservation };
  });

  // Create new reservation
  fastify.post<{ Body: CreateReservationData }>("/reservations", async (request, reply) => {
    const { confirmationNumber, guestId, roomTypeId, ratePlanId, checkInDate, checkOutDate, totalRate } = request.body;

    if (!confirmationNumber || !guestId || !roomTypeId || !ratePlanId || !checkInDate || !checkOutDate || totalRate === undefined || totalRate === null) {
      return reply.status(400).send({ error: "Confirmation number, guest, room type, rate plan, check-in date, check-out date, and total rate are required" });
    }

    try {
      const reservation = await reservationsService.create(request.body);
      return { success: true, reservation };
    } catch (error: any) {
      if (error.message.includes("Invalid") || error.message.includes("date")) {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Confirmation number already exists" });
      }
      throw error;
    }
  });

  // Update reservation
  fastify.put<{ Params: { id: string }; Body: UpdateReservationData }>("/reservations/:id", async (request, reply) => {
    try {
      const reservation = await reservationsService.update(request.params.id, request.body);

      if (!reservation) {
        return reply.status(404).send({ error: "Reservation not found" });
      }

      return { success: true, reservation };
    } catch (error: any) {
      if (error.message.includes("Invalid") || error.message.includes("date") || error.message === "No fields to update") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Confirmation number already exists" });
      }
      throw error;
    }
  });

  // Delete reservation
  fastify.delete<{ Params: { id: string } }>("/reservations/:id", async (request, reply) => {
    try {
      const reservation = await reservationsService.delete(request.params.id);

      if (!reservation) {
        return reply.status(404).send({ error: "Reservation not found" });
      }

      return { success: true, reservation };
    } catch (error: any) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return reply.status(400).send({ error: "Cannot delete reservation: room occupancy records are linked to this reservation" });
      }
      throw error;
    }
  });
}
