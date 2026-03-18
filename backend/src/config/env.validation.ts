import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  DATABASE_URL: Joi.string().required(),
  DB_POOL_MAX: Joi.number().default(20),
  DB_POOL_IDLE_TIMEOUT: Joi.number().default(30000),
  DB_POOL_CONNECTION_TIMEOUT: Joi.number().default(5000),

  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(60),

  CORS_ORIGIN: Joi.string().default(
    'http://localhost:5173,http://localhost:3000',
  ),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
});
