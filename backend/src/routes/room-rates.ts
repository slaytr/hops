import { FastifyInstance } from "fastify";
import { roomRatesService, CreateRoomRateData, UpdateRoomRateData } from "../services/room-rates.js";

export default async function roomRatesRoutes(fastify: FastifyInstance) {
  // Get all room rates
  fastify.get("/room-rates", async () => {
    const roomRates = await roomRatesService.getAll();
    return { roomRates };
  });

  // Get room rate by ID
  fastify.get<{ Params: { id: string } }>("/room-rates/:id", async (request, reply) => {
    const roomRate = await roomRatesService.getById(request.params.id);

    if (!roomRate) {
      return reply.status(404).send({ error: "Room rate not found" });
    }

    return { roomRate };
  });

  // Create new room rate
  fastify.post<{ Body: CreateRoomRateData }>("/room-rates", async (request, reply) => {
    const { roomTypeId, ratePlanId, rate } = request.body;

    if (!roomTypeId || !ratePlanId || rate === undefined || rate === null) {
      return reply.status(400).send({ error: "Room type, rate plan, and rate are required" });
    }

    try {
      const roomRate = await roomRatesService.create(request.body);
      return { success: true, roomRate };
    } catch (error: any) {
      if (error.message.includes("Invalid") || error.message.includes("rate")) {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "A room rate already exists for this room type, rate plan, and day combination" });
      }
      throw error;
    }
  });

  // Update room rate
  fastify.put<{ Params: { id: string }; Body: UpdateRoomRateData }>("/room-rates/:id", async (request, reply) => {
    try {
      const roomRate = await roomRatesService.update(request.params.id, request.body);

      if (!roomRate) {
        return reply.status(404).send({ error: "Room rate not found" });
      }

      return { success: true, roomRate };
    } catch (error: any) {
      if (error.message.includes("Invalid") || error.message.includes("rate") || error.message === "No fields to update") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "A room rate already exists for this room type, rate plan, and day combination" });
      }
      throw error;
    }
  });

  // Delete room rate
  fastify.delete<{ Params: { id: string } }>("/room-rates/:id", async (request, reply) => {
    const roomRate = await roomRatesService.delete(request.params.id);

    if (!roomRate) {
      return reply.status(404).send({ error: "Room rate not found" });
    }

    return { success: true, roomRate };
  });
}
