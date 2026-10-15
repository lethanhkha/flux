import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from server directory or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://flux_user:flux_secure_password_2026@localhost:5432/flux_db?schema=public'),
  REDIS_URL: z.string().default('redis://:flux_redis_secure_pass_2026@localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32).default('flux_super_secret_jwt_access_key_2026_min_32_chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32).default('flux_super_secret_jwt_refresh_key_2026_min_32_chars'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('flux_cookie_secret_signing_key_2026'),

  // Email & SMTP Configuration (Gmail SMTP supported)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().transform(Number).default('465'),
  SMTP_SECURE: z.string().transform((v) => v === 'true' || v === '1').default('true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('Flux Workspace <no-reply@flux.workspace>'),
  GMAIL_USER: z.string().default(''),
  GMAIL_APP_PASSWORD: z.string().default(''),

  // Google OAuth2 Configuration
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:5000/api/v1/auth/google/callback'),

  // Cloudflare Turnstile Anti-Bot Security
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().default('1x0000000000000000000000000000000AA'),
  CLOUDFLARE_TURNSTILE_ENABLED: z.string().transform((v) => v === 'true' || v === '1').default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid Environment Variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
