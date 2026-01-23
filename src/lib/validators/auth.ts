import { z } from "zod";
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(60, "El nombre es demasiado largo."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("El email no es válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/[a-z]/, "Debe incluir al menos una letra minúscula.")
    .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula.")
    .regex(/[0-9]/, "Debe incluir al menos un número.")
    .max(200, "La contraseña es demasiado larga."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
