import { z } from "zod";

export const liveStartSchema = z.object({
  language: z.string().min(2).max(30),
  context: z.string().max(300).optional().or(z.literal("")),
  mimeType: z.string().min(3).max(80).optional(),
});

export type LiveStartInput = z.infer<typeof liveStartSchema>;
