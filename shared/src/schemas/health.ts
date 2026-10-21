import { z } from 'zod';

// Resposta de GET /api/health
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  app: z.string(),
  version: z.string(),
  time: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
