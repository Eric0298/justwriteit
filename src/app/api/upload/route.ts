import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";
import { getUsageStatus } from "@/lib/queries/billing";
import { getClientIp } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  // El webhook `blob.upload-completed` viene server-to-server desde Vercel Blob
  // sin cookies de sesión — `handleUpload` verifica su HMAC internamente.
  // El auth/rate-limit/usage solo se aplica al token del cliente.
  const isClientToken = body.type === "blob.generate-client-token";

  try {
    if (isClientToken) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado." }, { status: 401 });
      }

      const ip = await getClientIp();
      const limited = await rateLimit({
        key: `upload:${session.user.id}:${ip}`,
        limit: 12,
        windowMs: 60_000,
      });

      if (!limited.ok) {
        return NextResponse.json(
          { error: "Demasiadas subidas. Espera un momento." },
          { status: 429 }
        );
      }

      const usage = await getUsageStatus(session.user.id);

      if (!usage.canTranscribe) {
        return NextResponse.json({ error: usage.message, usage }, { status: 429 });
      }

      void usage;
      const jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => ({
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        }),
        onUploadCompleted: async ({
          blob,
          tokenPayload,
        }: {
          blob: PutBlobResult;
          tokenPayload?: string | null;
        }) => {
          void blob;
          void tokenPayload;
        },
      });

      return NextResponse.json(jsonResponse);
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
      }),
      onUploadCompleted: async ({
        blob,
        tokenPayload,
      }: {
        blob: PutBlobResult;
        tokenPayload?: string | null;
      }) => {
        void blob;
        void tokenPayload;
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
