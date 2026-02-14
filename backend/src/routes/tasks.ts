import { FastifyInstance } from "fastify";
import { tasksService, CreateTaskData, UpdateTaskData } from "../services/tasks.js";

export default async function tasksRoutes(fastify: FastifyInstance) {
  // Get all tasks with optional filters
  fastify.get<{ Querystring: { date?: string; startDate?: string; endDate?: string; status?: string; staffId?: string } }>("/tasks", async (request) => {
    const tasks = await tasksService.getAll(request.query);
    return { tasks };
  });

  // Get task by ID
  fastify.get<{ Params: { id: string } }>("/tasks/:id", async (request, reply) => {
    const task = await tasksService.getById(request.params.id);

    if (!task) {
      return reply.status(404).send({ error: "Task not found" });
    }

    return { task };
  });

  // Create new task
  fastify.post<{ Body: CreateTaskData }>("/tasks", async (request, reply) => {
    const { roomId, assignedStaffId } = request.body;

    if (!roomId || !assignedStaffId) {
      return reply.status(400).send({ error: "Room and assigned staff are required" });
    }

    try {
      const task = await tasksService.create(request.body);
      return { success: true, task };
    } catch (error: any) {
      if (error.message.includes("Invalid") || error.message.includes("required") || error.message.includes("date")) {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "A task of this type already exists for this room on this date" });
      }
      throw error;
    }
  });

  // Update task
  fastify.put<{ Params: { id: string }; Body: UpdateTaskData }>("/tasks/:id", async (request, reply) => {
    try {
      const task = await tasksService.update(request.params.id, request.body);

      if (!task) {
        return reply.status(404).send({ error: "Task not found" });
      }

      return { success: true, task };
    } catch (error: any) {
      if (error.message.includes("Invalid") || error.message.includes("No fields") || error.message.includes("date")) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  // Delete task
  fastify.delete<{ Params: { id: string } }>("/tasks/:id", async (request, reply) => {
    const task = await tasksService.delete(request.params.id);

    if (!task) {
      return reply.status(404).send({ error: "Task not found" });
    }

    return { success: true, task };
  });
}
