import { FastifyInstance } from "fastify";
import { usersService } from "../services/users.js";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";

export default async function usersRoutes(fastify: FastifyInstance) {
  // Get all users — authenticated; permissions only visible to admins
  fastify.get("/users", { preHandler: [authenticate] }, async (request) => {
    const users = await usersService.getAll();
    const isAdmin = request.authUser?.userType === 'admin';
    if (isAdmin) return { users };
    // Strip permissions from staff records for non-admin callers
    const sanitized = users.map((u: any) => {
      const plain = u.get ? u.get({ plain: true }) : { ...u };
      if (plain.staff) {
        const { permissions: _p, ...staffWithoutPerms } = plain.staff;
        plain.staff = staffWithoutPerms;
      }
      return plain;
    });
    return { users: sanitized };
  });

  // Get user by ID — authenticated
  fastify.get<{ Params: { id: string } }>("/users/:id", { preHandler: [authenticate] }, async (request, reply) => {
    const user = await usersService.getById(request.params.id);

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return { user };
  });

  // Create new user — admin only
  fastify.post<{
    Body: {
      email: string;
      userType: string;
      status?: string;
      password: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      permissions?: string[];
    }
  }>("/users", { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { email, userType, status, password, firstName, lastName, role, permissions } = request.body;

    if (!email || !userType) {
      return reply.status(400).send({ error: "Email and user type are required" });
    }

    if (!password) {
      return reply.status(400).send({ error: "Password is required" });
    }

    try {
      const user = await usersService.create({ email, userType, status, password, firstName, lastName, role, permissions });
      return { success: true, user };
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Email already exists" });
      }
      if (error.message === 'First name, last name, and role are required for staff users') {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  // Update user — admin only
  fastify.put<{
    Params: { id: string };
    Body: {
      email?: string;
      userType?: string;
      status?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      permissions?: string[];
    }
  }>("/users/:id", { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { email, userType, status, password, firstName, lastName, role, permissions } = request.body;

    try {
      const user = await usersService.update(request.params.id, {
        email, userType, status, password, firstName, lastName, role, permissions
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return { success: true, user };
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Email already exists" });
      }
      if (error.message === 'No linked staff record found for this user') {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  // Delete user — admin only
  fastify.delete<{ Params: { id: string } }>("/users/:id", { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
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
