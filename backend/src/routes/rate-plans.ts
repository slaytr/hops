import { FastifyInstance } from "fastify";
import { ratePlansService, CreateRatePlanData, UpdateRatePlanData } from "../services/rate-plans.js";

export default async function ratePlansRoutes(fastify: FastifyInstance) {
  // Get all rate plans
  fastify.get("/rate-plans", async () => {
    const ratePlans = await ratePlansService.getAll();
    return { ratePlans };
  });

  // Get rate plan by ID
  fastify.get<{ Params: { id: string } }>("/rate-plans/:id", async (request, reply) => {
    const ratePlan = await ratePlansService.getById(request.params.id);

    if (!ratePlan) {
      return reply.status(404).send({ error: "Rate plan not found" });
    }

    return { ratePlan };
  });

  // Create new rate plan
  fastify.post<{ Body: CreateRatePlanData }>("/rate-plans", async (request, reply) => {
    const { code, name } = request.body;

    if (!code || !name) {
      return reply.status(400).send({ error: "Code and name are required" });
    }

    try {
      const ratePlan = await ratePlansService.create(request.body);
      return { success: true, ratePlan };
    } catch (error: any) {
      if (error.message.includes("nights") || error.message.includes("percentage")) {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Rate plan code already exists" });
      }
      throw error;
    }
  });

  // Update rate plan
  fastify.put<{ Params: { id: string }; Body: UpdateRatePlanData }>("/rate-plans/:id", async (request, reply) => {
    try {
      const ratePlan = await ratePlansService.update(request.params.id, request.body);

      if (!ratePlan) {
        return reply.status(404).send({ error: "Rate plan not found" });
      }

      return { success: true, ratePlan };
    } catch (error: any) {
      if (error.message.includes("nights") || error.message.includes("percentage") || error.message === "No fields to update") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: "Rate plan code already exists" });
      }
      throw error;
    }
  });

  // Delete rate plan
  fastify.delete<{ Params: { id: string } }>("/rate-plans/:id", async (request, reply) => {
    try {
      const ratePlan = await ratePlansService.delete(request.params.id);

      if (!ratePlan) {
        return reply.status(404).send({ error: "Rate plan not found" });
      }

      return { success: true, ratePlan };
    } catch (error: any) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return reply.status(400).send({ error: "Cannot delete rate plan: room rates or reservations are using this plan" });
      }
      throw error;
    }
  });
}
