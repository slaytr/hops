import { FastifyInstance } from 'fastify';
import oauthPlugin from '@fastify/oauth2';
import type { OAuth2Namespace } from '@fastify/oauth2';
import cookie from '@fastify/cookie';
import { authService } from '../services/auth.js';

// Access OAuth2 provider configurations at runtime
const { GOOGLE_CONFIGURATION, FACEBOOK_CONFIGURATION } = oauthPlugin as any;

// Extend FastifyInstance to declare OAuth2 namespaces
declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
    facebookOAuth2: OAuth2Namespace;
  }
}

interface JwtPayload {
  id: number;
  email: string;
}

function sanitizeUser(user: any) {
  const plain = user.get ? user.get({ plain: true }) : { ...user };
  delete plain.passwordHash;
  return plain;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Register @fastify/cookie (required by @fastify/oauth2)
  await fastify.register(cookie);

  // Conditionally register Google OAuth2
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: 'googleOAuth2',
      scope: ['profile', 'email'],
      credentials: {
        client: {
          id: process.env.GOOGLE_CLIENT_ID,
          secret: process.env.GOOGLE_CLIENT_SECRET,
        },
        auth: GOOGLE_CONFIGURATION,
      },
      startRedirectPath: '/auth/google',
      callbackUri:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
    });
  }

  // Conditionally register Facebook OAuth2
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: 'facebookOAuth2',
      scope: ['email'],
      credentials: {
        client: {
          id: process.env.FACEBOOK_CLIENT_ID,
          secret: process.env.FACEBOOK_CLIENT_SECRET,
        },
        auth: FACEBOOK_CONFIGURATION,
      },
      startRedirectPath: '/auth/facebook',
      callbackUri:
        process.env.FACEBOOK_CALLBACK_URL ||
        'http://localhost:3000/auth/facebook/callback',
    });
  }

  // POST /auth/register
  fastify.post<{
    Body: { email: string; password: string; userType?: 'staff' | 'guest' | 'admin' };
  }>('/auth/register', async (request, reply) => {
    const { email, password, userType } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    try {
      const user = await authService.register(email, password, userType);
      const payload: JwtPayload = { id: user.get('id') as number, email: user.get('email') as string };
      const token = fastify.jwt.sign(payload, { expiresIn: '7d' });
      return { token, user: sanitizeUser(user) };
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return reply.status(400).send({ error: 'Email already registered' });
      }
      throw error;
    }
  });

  // POST /auth/login
  fastify.post<{
    Body: { email: string; password: string };
  }>('/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const user = await authService.login(email, password);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const payload: JwtPayload = { id: user.get('id') as number, email: user.get('email') as string };
    const token = fastify.jwt.sign(payload, { expiresIn: '7d' });
    return { token, user: sanitizeUser(user) };
  });

  // GET /auth/me
  fastify.get('/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const rawToken = authHeader?.replace('Bearer ', '') ?? '';

    if (!rawToken) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const decoded = fastify.jwt.verify(rawToken) as JwtPayload;
      const user = await authService.findUserById(decoded.id);
      if (!user) {
        return reply.status(401).send({ error: 'User not found' });
      }
      return { user: sanitizeUser(user) };
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // GET /auth/google/callback
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    fastify.get('/auth/google/callback', async (request, reply) => {
      try {
        const result = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request, reply);
        const accessToken = result.token.access_token;

        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = (await profileRes.json()) as { id: string; email: string };

        const { user } = await authService.findOrCreateOAuthUser('google', profile.id, profile.email);
        const payload: JwtPayload = { id: user.get('id') as number, email: user.get('email') as string };
        const token = fastify.jwt.sign(payload, { expiresIn: '7d' });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return reply.redirect(`${frontendUrl}/login?token=${token}`);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'OAuth authentication failed' });
      }
    });
  }

  // GET /auth/facebook/callback
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    fastify.get('/auth/facebook/callback', async (request, reply) => {
      try {
        const result = await fastify.facebookOAuth2.getAccessTokenFromAuthorizationCodeFlow(request, reply);
        const accessToken = result.token.access_token;

        const profileRes = await fetch(
          `https://graph.facebook.com/me?fields=id,email&access_token=${accessToken}`,
        );
        const profile = (await profileRes.json()) as { id: string; email: string };

        const { user } = await authService.findOrCreateOAuthUser('facebook', profile.id, profile.email);
        const payload: JwtPayload = { id: user.get('id') as number, email: user.get('email') as string };
        const token = fastify.jwt.sign(payload, { expiresIn: '7d' });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return reply.redirect(`${frontendUrl}/login?token=${token}`);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'OAuth authentication failed' });
      }
    });
  }
}
