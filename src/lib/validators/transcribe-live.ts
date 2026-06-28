import { z } from "zod";
import { transcriptionLanguageSchema } from "@/lib/validators/transcribe";

export const liveStartSchema = z.object({
  language: transcriptionLanguageSchema,
  context: z.string().max(300).optional().or(z.literal("")),
  mimeType: z.string().min(3).max(80).optional(),
});

export type LiveStartInput = z.infer<typeof liveStartSchema>;

