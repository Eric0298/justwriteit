import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Nombre: minimo 2 caracteres.")
    .max(80, "Nombre: maximo 80 caracteres."),
  email: z
    .string()
    .email("Email invalido.")
    .max(254, "Email demasiado largo."),
  password: z
    .string()
    .min(8, "Contrasena: minimo 8 caracteres.")
    .max(128, "Contrasena demasiado larga.")
    .regex(/[A-Z]/, "Contrasena: debe incluir mayuscula.")
    .regex(/[a-z]/, "Contrasena: debe incluir minuscula.")
    .regex(/[0-9]/, "Contrasena: debe incluir numero."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

