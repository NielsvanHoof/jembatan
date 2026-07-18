/**
 * Progress query validation (Zod).
 * Optional filters for getProgressStats — keep parsing out of the action body.
 */

import { z } from "zod";
import { studyDirectionSchema } from "@/features/study/schemas";

export const progressStatsOptionsSchema = z.object({
  direction: studyDirectionSchema.optional(),
  deckSlug: z.string().min(1).optional(),
});

export type ProgressStatsOptions = z.infer<typeof progressStatsOptionsSchema>;
