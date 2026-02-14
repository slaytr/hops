import { FastifyInstance } from "fastify";
import { guestsService, CreateGuestData, UpdateGuestData } from "../services/guests.js";

export default async function guestsRoutes(fastify: FastifyInstance) {
  // Get all guests
  fastify.get("/guests", async () => {
    const guests = await guestsService.getAll();
    return { guests };
  });

  // Get guest by ID
  fastify.get<{ Params: { id: string } }>("/guests/:id", async (request, reply) => {
    const guest = await guestsService.getById(request.params.id);

    if (!guest) {
      return reply.status(404).send({ error: "Guest not found" });
    }

    return { guest };
  });

  // Create new guest
  fastify.post<{ Body: CreateGuestData }>("/guests", async (request, reply) => {
    const { firstName, lastName, email } = request.body;

    if (!firstName || !lastName || !email) {
      return reply.status(400).send({ error: "First name, last name, and email are required" });
    }

    try {
      const guest = await guestsService.create(request.body);
      return { success: true, guest };
    } catch (error: any) {
      if (error.message === "Invalid user ID" || error.message === "User type must be 'guest'") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Email or user ID already exists" });
      }
      throw error;
    }
  });

  // Update guest
  fastify.put<{ Params: { id: string }; Body: UpdateGuestData }>("/guests/:id", async (request, reply) => {
    try {
      const guest = await guestsService.update(request.params.id, request.body);

      if (!guest) {
        return reply.status(404).send({ error: "Guest not found" });
      }

      return { success: true, guest };
    } catch (error: any) {
      if (error.message === "No fields to update" || error.message === "Invalid user ID" || error.message === "User type must be 'guest'") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Email or user ID already exists" });
      }
      throw error;
    }
  });

  // Delete guest
  fastify.delete<{ Params: { id: string } }>("/guests/:id", async (request, reply) => {
    try {
      const guest = await guestsService.delete(request.params.id);

      if (!guest) {
        return reply.status(404).send({ error: "Guest not found" });
      }

      return { success: true, guest };
    } catch (error: any) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return reply.status(400).send({ error: "Cannot delete guest: reservations are linked to this guest" });
      }
      throw error;
    }
  });
}
