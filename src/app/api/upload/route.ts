import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async () => ({
  allowedContentTypes: ALLOWED_AUDIO_TYPES,
  maximumSizeInBytes: MAX_BYTES,
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
