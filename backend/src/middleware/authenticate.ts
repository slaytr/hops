import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db.js';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: { id: number; email: string; userType: string; permissions: string[] };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    request.authUser = request.user as { id: number; email: string; userType: string; permissions: string[] };
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.authUser) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  // Re-fetch from DB so stale JWTs cannot retain admin access after demotion
  const user = await db.models.User.findByPk(request.authUser.id, {
    attributes: ['id', 'userType', 'status'],
  });

  if (!user || user.get('userType') !== 'admin' || user.get('status') !== 'active') {
    return reply.status(403).send({ error: 'Forbidden: admin access required' });
  }
}
