// src/app/api/transcribe/file/route.ts
import { auth } from "@/../auth";
import { transcribeFileSchema } from "@/lib/validators/transcribe";
import { getTranscriptionAdapter } from "@/lib/transcription/adapter";
import {
  createTranscription,
  setTranscriptText,
  updateTranscriptionStatus,
  setNotificationStatus,
} from "@/lib/queries/transcriptions";
import { getUserById } from "@/lib/queries/users";
import { notifyTranscriptionCompleted } from "@/lib/n8n";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

type Body = {
  fileUrl: string;
  filename: string;
  mimeType: string;
  language: string;
  context?: string;
};

function isBody(v: unknown): v is Body {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.fileUrl === "string" &&
    typeof o.filename === "string" &&
    typeof o.mimeType === "string" &&
    typeof o.language === "string"
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  if (!isBody(body)) {
    return Response.json({ ok: false, error: "Body inválido." }, { status: 400 });
  }

  // Validación de language/context con tu schema actual
  const parsed = transcribeFileSchema.safeParse({
    language: body.language,
    context: body.context ?? "",
  });

  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // 1) Creamos registro "processing"
  const row = await createTranscription({
    userId: session.user.id,
    type: "file",
    language: parsed.data.language,
    status: "processing",
    audioFilename: body.filename,
  });

  try {
    // 2) Descargamos desde Vercel Blob
const fileRes = await fetch(body.fileUrl, { cache: "no-store" });
if (!fileRes.ok) {
  throw new Error(`No se pudo descargar el archivo (HTTP ${fileRes.status}).`);
}

// Si el servidor manda content-length, validamos antes
const lenHeader = fileRes.headers.get("content-length");
if (lenHeader) {
  const len = Number(lenHeader);
  if (Number.isFinite(len) && len > MAX_BYTES) {
    throw new Error("Archivo demasiado grande (máx 25MB).");
  }
}

const ab = await fileRes.arrayBuffer();
if (ab.byteLength <= 0) throw new Error("Archivo vacío.");
if (ab.byteLength > MAX_BYTES) throw new Error("Archivo demasiado grande (máx 25MB).");

const buffer = Buffer.from(ab);

    // 3) Transcribir
    const adapter = getTranscriptionAdapter();
    const out = await adapter.transcribeFile({
      fileBuffer: buffer,
      filename: body.filename,
      mimeType: body.mimeType || "application/octet-stream",
      language: parsed.data.language,
      context: parsed.data.context || undefined,
    });

    // 4) Guardar
    const saved = await setTranscriptText({
      id: row.id,
      userId: session.user.id,
      transcriptText: out.text,
      duration: out.durationSec ? Math.round(out.durationSec) : null,
      audioFilename: body.filename,
      audioUrl: body.fileUrl,
      segmentsJson: out.segments ? JSON.stringify(out.segments) : null,
    });

    // 5) Notificar (no bloqueante)
    try {
      const user = await getUserById(session.user.id);
      if (user && saved) {
        const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://justwriteit-i6j1.vercel.app";
        const notifyRes = await notifyTranscriptionCompleted({
          transcriptionId: saved.id,
          userEmail: user.email,
          userName: user.name,
          language: saved.language,
          type: saved.type,
          createdAt: new Date(saved.created_at).toISOString(),
          textSnippet: (out.text ?? "").slice(0, 300),
          detailUrl: `${baseUrl}/dashboard/history/${saved.id}`,
        });

        await setNotificationStatus({
          id: saved.id,
          userId: session.user.id,
          status: notifyRes.ok ? "sent" : "failed",
          error: notifyRes.ok ? null : notifyRes.error ?? "n8n error",
        });
      }
    } catch (err) {
      console.error("n8n notify failed (ignored):", err);
    }

return Response.json({ ok: true, transcription: saved, segments: out.segments ?? [] });  } catch (e) {
    await updateTranscriptionStatus({
      id: row.id,
      userId: session.user.id,
      status: "failed",
    });

    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Error procesando transcripción." },
      { status: 500 }
    );
  }
}
