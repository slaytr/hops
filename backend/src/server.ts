import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import NodeCache from "node-cache";

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
});

const cache = new NodeCache();
const USERS_KEY = "users";

// Initialize users array in cache
cache.set(USERS_KEY, []);

fastify.get("/", async () => {
  return { hello: "world" };
});

fastify.post<{ Body: { name: string } }>("/users", async (request, reply) => {
  const { name } = request.body;

  if (!name) {
    return reply.status(400).send({ error: "Name is required" });
  }

  const users = cache.get<string[]>(USERS_KEY) || [];
  users.push(name);
  cache.set(USERS_KEY, users);

  return { success: true, name };
});

fastify.get("/users", async () => {
  const users = cache.get<string[]>(USERS_KEY) || [];
  return { users };
});

const port = parseInt(process.env.PORT || "3000", 10);

const start = async () => {
  try {
    await fastify.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
