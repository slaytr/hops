import { FastifyInstance } from "fastify";
import { usersService } from "../services/users.js";

export default async function usersRoutes(fastify: FastifyInstance) {
  // Get all users
  fastify.get("/users", async () => {
    const users = await usersService.getAll();
    return { users };
  });

  // Get user by ID
  fastify.get<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
    const user = await usersService.getById(request.params.id);

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return { user };
  });

  // Create new user
  fastify.post<{ Body: { email: string; userType: string; status?: string } }>("/users", async (request, reply) => {
    const { email, userType, status } = request.body;

    if (!email || !userType) {
      return reply.status(400).send({ error: "Email and user type are required" });
    }

    try {
      const user = await usersService.create({ email, userType, status });
      return { success: true, user };
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Email already exists" });
      }
      throw error;
    }
  });

  // Update user
  fastify.put<{ Params: { id: string }; Body: { email?: string; userType?: string; status?: string } }>("/users/:id", async (request, reply) => {
    const { email, userType, status } = request.body;

    try {
      const user = await usersService.update(request.params.id, { email, userType, status });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return { success: true, user };
    } catch (error: any) {
      if (error.message === "No fields to update") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Email already exists" });
      }
      throw error;
    }
  });

  // Delete user
  fastify.delete<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
    try {
      const user = await usersService.delete(request.params.id);

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return { success: true, user };
    } catch (error: any) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return reply.status(400).send({ error: "Cannot delete user: staff or guest records are linked to this user" });
      }
      throw error;
    }
  });
}
