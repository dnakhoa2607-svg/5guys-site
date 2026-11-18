import 'dotenv/config';
import { z } from 'zod';

const env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5500'),
  DB_HOST: z.string().default('127.0.0.1'), DB_PORT: z.coerce.number().int().default(3306),
  DB_NAME: z.string().default('5guys_store'), DB_USER: z.string(), DB_PASSWORD: z.string(),
  JWT_SECRET: z.string().min(32), JWT_EXPIRES_IN: z.string().default('2h'),
  // Gemini: chỉ đọc ở backend, KHÔNG BAO GIỜ gửi xuống frontend. Để trống -> trợ lý dùng gợi ý theo luật.
  GEMINI_API_KEY: z.string().trim().optional().transform(v => v || undefined),
  GEMINI_MODEL: z.string().trim().min(1).default('gemini-3.5-flash')
}).parse(process.env);

export default env;
