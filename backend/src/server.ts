import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { testConnection } from "./db.js";
import { registerRoutes } from "./routes/index.js";

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'hops-dev-secret-change-in-production',
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register all routes
await registerRoutes(fastify);

// ==================== SERVER ====================

const port = parseInt(process.env.PORT || "3000", 10);

const start = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    fastify.log.info('Database connection established');

    await fastify.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
