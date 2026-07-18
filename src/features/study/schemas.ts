/**
 * Study input validation (Zod).
 * Used by server actions; schemas never import actions.
 */

import { z } from "zod";

export const studyDirectionSchema = z.enum(["id_to_nl", "nl_to_id"]);

export const sm2RatingSchema = z.enum(["again", "hard", "good", "easy"]);

export const reviewCardInputSchema = z.object({
  progressId: z.string().min(1),
  rating: sm2RatingSchema,
});

export type ReviewCardInput = z.infer<typeof reviewCardInputSchema>;
