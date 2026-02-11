// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/../auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_AUDIO = [
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

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      request,
      body,

      onBeforeGenerateToken: async () => {
        // ✅ importante: autenticar antes de emitir token
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        return {
          allowedContentTypes: ALLOWED_AUDIO,
          // opcional (te vuelve en onUploadCompleted)
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Aquí podrías guardar blob.url en BD si lo quisieras.
        // O simplemente loguear.
        console.log("Blob upload completed:", blob.url, tokenPayload);
      },
    });

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
