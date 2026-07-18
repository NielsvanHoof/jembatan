/**
 * Auth input validation (Zod).
 * Actions depend on schemas; schemas never depend on actions.
 */

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(100),
  locale: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
  locale: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
