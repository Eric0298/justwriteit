import { z } from "zod";

export const transcribeFileSchema = z.object({
  language: z.string().min(2).max(30),
  context: z.string().max(300).optional().or(z.literal("")),
});

export type TranscribeFileInput = z.infer<typeof transcribeFileSchema>;
