import { FastifyInstance } from "fastify";
import { roomOccupanciesService, CreateRoomOccupancyData, UpdateRoomOccupancyData } from "../services/room-occupancies.js";

export default async function roomOccupanciesRoutes(fastify: FastifyInstance) {
  // Get all room occupancies with optional filters
  fastify.get<{ Querystring: { occupancyDate?: string; roomId?: string; status?: string } }>("/room-occupancies", async (request) => {
    const roomOccupancies = await roomOccupanciesService.getAll(request.query);
    return { roomOccupancies };
  });

  // Get room occupancy by ID
  fastify.get<{ Params: { id: string } }>("/room-occupancies/:id", async (request, reply) => {
    const roomOccupancy = await roomOccupanciesService.getById(request.params.id);

    if (!roomOccupancy) {
      return reply.status(404).send({ error: "Room occupancy not found" });
    }

    return { roomOccupancy };
  });

  // Create new room occupancy
  fastify.post<{ Body: CreateRoomOccupancyData }>("/room-occupancies", async (request, reply) => {
    const { roomId, occupancyDate } = request.body;

    if (!roomId || !occupancyDate) {
      return reply.status(400).send({ error: "Room and occupancy date are required" });
    }

    try {
      const roomOccupancy = await roomOccupanciesService.create(request.body);
      return { success: true, roomOccupancy };
    } catch (error: any) {
      if (error.message.includes("Invalid")) {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Room occupancy already exists for this room and date" });
      }
      throw error;
    }
  });

  // Update room occupancy
  fastify.put<{ Params: { id: string }; Body: UpdateRoomOccupancyData }>("/room-occupancies/:id", async (request, reply) => {
    try {
      const roomOccupancy = await roomOccupanciesService.update(request.params.id, request.body);

      if (!roomOccupancy) {
        return reply.status(404).send({ error: "Room occupancy not found" });
      }

      return { success: true, roomOccupancy };
    } catch (error: any) {
      if (error.message.includes("Invalid") || error.message === "No fields to update") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Room occupancy already exists for this room and date" });
      }
      throw error;
    }
  });

  // Delete room occupancy
  fastify.delete<{ Params: { id: string } }>("/room-occupancies/:id", async (request, reply) => {
    const roomOccupancy = await roomOccupanciesService.delete(request.params.id);

    if (!roomOccupancy) {
      return reply.status(404).send({ error: "Room occupancy not found" });
    }

    return { success: true, roomOccupancy };
  });
}
