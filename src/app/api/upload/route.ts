import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";
import { getUsageStatus } from "@/lib/queries/billing";
import { ALLOWED_AUDIO_MIME_TYPES } from "@/lib/security/audioValidation";
import { getClientIp } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
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

    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async () => ({
        allowedContentTypes: Array.from(ALLOWED_AUDIO_MIME_TYPES),
        maximumSizeInBytes: usage.maxAudioFileSizeBytes,
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
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
