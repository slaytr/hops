import { FastifyInstance } from "fastify";
import { roomTypesService, CreateRoomTypeData, UpdateRoomTypeData } from "../services/room-types.js";

export default async function roomTypesRoutes(fastify: FastifyInstance) {
  // Get all room types
  fastify.get("/room-types", async () => {
    const roomTypes = await roomTypesService.getAll();
    return { roomTypes };
  });

  // Get room type by ID
  fastify.get<{ Params: { id: string } }>("/room-types/:id", async (request, reply) => {
    const roomType = await roomTypesService.getById(request.params.id);

    if (!roomType) {
      return reply.status(404).send({ error: "Room type not found" });
    }

    return { roomType };
  });

  // Create new room type
  fastify.post<{ Body: CreateRoomTypeData }>("/room-types", async (request, reply) => {
    const { name, baseRate, maxOccupancy } = request.body;

    if (!name || baseRate === undefined || baseRate === null || !maxOccupancy) {
      return reply.status(400).send({ error: "Name, base rate, and max occupancy are required" });
    }

    try {
      const roomType = await roomTypesService.create(request.body);
      return { success: true, roomType };
    } catch (error: any) {
      if (error.message === "Base rate must be non-negative" || error.message === "Max occupancy must be at least 1") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Room type name already exists" });
      }
      throw error;
    }
  });

  // Update room type
  fastify.put<{ Params: { id: string }; Body: UpdateRoomTypeData }>("/room-types/:id", async (request, reply) => {
    try {
      const roomType = await roomTypesService.update(request.params.id, request.body);

      if (!roomType) {
        return reply.status(404).send({ error: "Room type not found" });
      }

      return { success: true, roomType };
    } catch (error: any) {
      if (error.message === "No fields to update" || error.message === "Base rate must be non-negative" || error.message === "Max occupancy must be at least 1") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Room type name already exists" });
      }
      throw error;
    }
  });

  // Delete room type
  fastify.delete<{ Params: { id: string } }>("/room-types/:id", async (request, reply) => {
    try {
      const roomType = await roomTypesService.delete(request.params.id);

      if (!roomType) {
        return reply.status(404).send({ error: "Room type not found" });
      }

      return { success: true, roomType };
    } catch (error: any) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return reply.status(400).send({ error: "Cannot delete room type: rooms exist with this type" });
      }
      throw error;
    }
  });
}
