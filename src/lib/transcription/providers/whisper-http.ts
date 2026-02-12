// src/lib/transcription/providers/whisper-http.ts

export type WhisperTranscribeResult = {
  text: string;
  durationSec: number;
  language: string;
};

type WhisperServiceOk = {
  ok: true;
  text: string;
  durationSec: number;
  language?: string;
};

type WhisperServiceErr = {
  ok: false;
  detail?: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isWhisperOk(v: unknown): v is WhisperServiceOk {
  return (
    isObject(v) &&
    v.ok === true &&
    typeof v.text === "string" &&
    typeof v.durationSec === "number"
  );
}

function isWhisperErr(v: unknown): v is WhisperServiceErr {
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

    // ✅ Buffer -> ArrayBuffer REAL (evita ArrayBufferLike/SharedArrayBuffer)
    const ab = input.fileBuffer.buffer.slice(
      input.fileBuffer.byteOffset,
      input.fileBuffer.byteOffset + input.fileBuffer.byteLength
    ) as ArrayBuffer;

    const blob = new Blob([ab], { type: input.mimeType });

    fd.append("file", blob, input.filename);
    fd.append("language", input.language);
    if (input.context) fd.append("context", input.context);

    const res = await fetch(`${this.baseUrl}/transcribe/file`, {
      method: "POST",
      body: fd,
    });

    const raw = await res.text();

    if (!res.ok) {
      throw new Error(`Whisper service error: ${res.status} ${raw}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Whisper service: respuesta no JSON: ${raw.slice(0, 200)}`);
    }

    if (isWhisperOk(parsed)) {
      return {
        text: parsed.text,
        durationSec: parsed.durationSec,
        language: typeof parsed.language === "string" ? parsed.language : input.language,
      };
    }

    if (isWhisperErr(parsed)) {
      const msg = typeof parsed.detail === "string" ? parsed.detail : "Fallo en Whisper";
      throw new Error(`Whisper transcription failed: ${msg}`);
    }

    throw new Error("Whisper service: formato de respuesta inválido");
  }
}
