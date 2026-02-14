import { FastifyInstance } from "fastify";
import usersRoutes from "./users.js";
import staffRoutes from "./staff.js";
import roomTypesRoutes from "./room-types.js";
import roomsRoutes from "./rooms.js";
import tasksRoutes from "./tasks.js";
import guestsRoutes from "./guests.js";
import ratePlansRoutes from "./rate-plans.js";
import roomRatesRoutes from "./room-rates.js";
import reservationsRoutes from "./reservations.js";
import roomOccupanciesRoutes from "./room-occupancies.js";

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(usersRoutes);
  await fastify.register(staffRoutes);
  await fastify.register(roomTypesRoutes);
  await fastify.register(roomsRoutes);
  await fastify.register(tasksRoutes);
  await fastify.register(guestsRoutes);
  await fastify.register(ratePlansRoutes);
  await fastify.register(roomRatesRoutes);
  await fastify.register(reservationsRoutes);
  await fastify.register(roomOccupanciesRoutes);
}
