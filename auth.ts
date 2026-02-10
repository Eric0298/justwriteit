import NextAuth, { type NextAuthConfig, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserByEmail } from "@/lib/queries/users";
import { SignJWT, jwtVerify } from "jose";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function secretBytes() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("Missing NEXTAUTH_SECRET");
  return new TextEncoder().encode(s);
}

type JWTPayloadWithId = JWT & { id?: string };
type SessionUserWithId = Session["user"] & { id?: string };

export const authConfig = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

  jwt: {
    async encode({ token, maxAge }) {
      if (!token) return "";
      const now = Math.floor(Date.now() / 1000);
      const exp = now + (maxAge ?? 30 * 24 * 60 * 60);

      const payload: Record<string, unknown> = { ...(token as Record<string, unknown>) };

      return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(now)
        .setExpirationTime(exp)
        .sign(secretBytes());
    },

    async decode({ token }) {
      if (!token) return null;

      try {
        const { payload } = await jwtVerify(token, secretBytes());
        return payload as unknown as JWT;
      } catch {
        return null;
      }
    },
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const password = parsed.data.password;

        const user = await getUserByEmail(email);
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const t = token as JWTPayloadWithId;
      if (user?.id) t.id = user.id;
      return t;
    },

    async session({ session, token }) {
      const t = token as JWTPayloadWithId;
      if (session.user && t.id) {
        const u = session.user as SessionUserWithId;
        u.id = t.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
