import { FastifyInstance } from "fastify";
import { roomsService, CreateRoomData, UpdateRoomData } from "../services/rooms.js";

export default async function roomsRoutes(fastify: FastifyInstance) {
  // Get all rooms
  fastify.get("/rooms", async () => {
    const rooms = await roomsService.getAll();
    return { rooms };
  });

  // Get room by ID
  fastify.get<{ Params: { id: string } }>("/rooms/:id", async (request, reply) => {
    const room = await roomsService.getById(request.params.id);

    if (!room) {
      return reply.status(404).send({ error: "Room not found" });
    }

    return { room };
  });

  // Create new room
  fastify.post<{ Body: CreateRoomData }>("/rooms", async (request, reply) => {
    const { roomNumber, roomTypeId } = request.body;

    if (!roomNumber || !roomTypeId) {
      return reply.status(400).send({ error: "Room number and room type are required" });
    }

    try {
      const room = await roomsService.create(request.body);
      return { success: true, room };
    } catch (error: any) {
      if (error.message === "Invalid room type ID") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Room number already exists" });
      }
      throw error;
    }
  });

  // Update room
  fastify.put<{ Params: { id: string }; Body: UpdateRoomData }>("/rooms/:id", async (request, reply) => {
    try {
      const room = await roomsService.update(request.params.id, request.body);

      if (!room) {
        return reply.status(404).send({ error: "Room not found" });
      }

      return { success: true, room };
    } catch (error: any) {
      if (error.message === "No fields to update" || error.message === "Invalid room type ID") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Room number already exists" });
      }
      throw error;
    }
  });

  // Delete room
  fastify.delete<{ Params: { id: string } }>("/rooms/:id", async (request, reply) => {
    const room = await roomsService.delete(request.params.id);

    if (!room) {
      return reply.status(404).send({ error: "Room not found" });
    }

    return { success: true, room };
  });
}
