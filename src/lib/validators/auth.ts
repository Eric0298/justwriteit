// src/lib/validators/auth.ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nombre: mínimo 2 caracteres."),
  email: z.string().email("Email inválido."),
  password: z
    .string()
    .min(8, "Contraseña: mínimo 8 caracteres.")
    .regex(/[A-Z]/, "Contraseña: debe incluir mayúscula.")
    .regex(/[a-z]/, "Contraseña: debe incluir minúscula.")
    .regex(/[0-9]/, "Contraseña: debe incluir número."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
