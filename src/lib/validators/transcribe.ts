import { z } from "zod";

export const transcriptionLanguageSchema = z.enum(["es", "en", "ca", "fr"]);

export const transcribeFileSchema = z.object({
  language: transcriptionLanguageSchema,
  context: z.string().max(300).optional().or(z.literal("")),
});

export type TranscribeFileInput = z.infer<typeof transcribeFileSchema>;

