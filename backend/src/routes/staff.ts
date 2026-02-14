import { FastifyInstance } from "fastify";
import { staffService, CreateStaffData, UpdateStaffData } from "../services/staff.js";

export default async function staffRoutes(fastify: FastifyInstance) {
  // Get all staff
  fastify.get("/staff", async () => {
    const staff = await staffService.getAll();
    return { staff };
  });

  // Get staff by ID
  fastify.get<{ Params: { id: string } }>("/staff/:id", async (request, reply) => {
    const staff = await staffService.getById(request.params.id);

    if (!staff) {
      return reply.status(404).send({ error: "Staff member not found" });
    }

    return { staff };
  });

  // Create new staff member
  fastify.post<{ Body: CreateStaffData }>("/staff", async (request, reply) => {
    const { firstName, lastName, role } = request.body;

    if (!firstName || !lastName || !role) {
      return reply.status(400).send({ error: "First name, last name, and role are required" });
    }

    try {
      const staff = await staffService.create(request.body);
      return { success: true, staff };
    } catch (error: any) {
      if (error.message === "Invalid user ID" || error.message === "User type must be 'staff'") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "User ID already linked to another staff member" });
      }
      throw error;
    }
  });

  // Update staff member
  fastify.put<{ Params: { id: string }; Body: UpdateStaffData }>("/staff/:id", async (request, reply) => {
    try {
      const staff = await staffService.update(request.params.id, request.body);

      if (!staff) {
        return reply.status(404).send({ error: "Staff member not found" });
      }

      return { success: true, staff };
    } catch (error: any) {
      if (error.message === "No fields to update" || error.message === "Invalid user ID" || error.message === "User type must be 'staff'") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "User ID already linked to another staff member" });
      }
      throw error;
    }
  });

  // Delete staff member
  fastify.delete<{ Params: { id: string } }>("/staff/:id", async (request, reply) => {
    try {
      const staff = await staffService.delete(request.params.id);

      if (!staff) {
        return reply.status(404).send({ error: "Staff member not found" });
      }

      return { success: true, staff };
    } catch (error: any) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return reply.status(400).send({ error: "Cannot delete staff member: tasks or reservations are assigned to this person" });
      }
      throw error;
    }
  });
}
