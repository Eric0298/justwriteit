// src/lib/transcription/providers/whisper-http.ts

export type WhisperTranscribeResult = {
  text: string;
  durationSec: number;
  language: string;
};

type WhisperOk = {
  ok: true;
  text: string;
  durationSec: number;
  language: string;
};

type WhisperErr = {
  ok: false;
  detail?: string;
  error?: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isWhisperOk(v: unknown): v is WhisperOk {
  return (
    isObject(v) &&
    v.ok === true &&
    typeof v.text === "string" &&
    typeof v.durationSec === "number" &&
    typeof v.language === "string"
  );
}

function isWhisperErr(v: unknown): v is WhisperErr {
  return isObject(v) && v.ok === false;
}

export class WhisperHttpAdapter {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async transcribeFile(input: {
    fileBuffer: Buffer;
    filename: string;
    mimeType: string;
    language: string;
    context?: string;
  }): Promise<WhisperTranscribeResult> {
    const fd = new FormData();

    // ✅ Buffer -> Uint8Array (válido como File/BlobPart en Node)
    const bytes = Uint8Array.from(input.fileBuffer);

    // ✅ Creamos File (evita el typing raro de BlobPart)
    const file = new File([bytes], input.filename, { type: input.mimeType });

    fd.append("file", file);
    fd.append("language", input.language);
    if (input.context) fd.append("context", input.context);

    const controller = new AbortController();
    const timeoutMs = 2 * 60_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/transcribe/file`, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });
    } catch (e) {
      throw new Error(
        `Whisper service unreachable: ${e instanceof Error ? e.message : "fetch failed"}`
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Whisper service error: ${res.status} ${txt || "(sin body)"}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Whisper respondió no-JSON: ${txt || "(vacío)"}`);
    }

    const data: unknown = await res.json().catch(() => null);

    if (isWhisperOk(data)) {
      return { text: data.text, durationSec: data.durationSec, language: data.language };
    }

    if (isWhisperErr(data)) {
      const msg = data.error || data.detail || "Whisper transcription failed";
      throw new Error(msg);
    }

    throw new Error("Respuesta inválida del servicio Whisper (JSON inesperado).");
  }
}
