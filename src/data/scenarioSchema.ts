import { readFileSync } from 'node:fs';
import { z } from 'zod';

const scenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  query: z.string().trim().min(1),
  maxPrice: z.number().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  limit: z.number().int().positive().default(5),
  expectEmpty: z.boolean().default(false),
});

export function parseScenarios(raw: unknown) {
  const result = z.array(scenarioSchema).min(1).safeParse(raw);
  if (!result.success) throw new Error(`Invalid scenarios:\n${z.prettifyError(result.error)}`);
  return result.data;
}

export const loadScenarios = (path: string) => parseScenarios(JSON.parse(readFileSync(path, 'utf8')));
