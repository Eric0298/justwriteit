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

function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  // Opción 1: Crear un nuevo ArrayBuffer y copiar los datos
  const arrayBuffer = new ArrayBuffer(buf.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buf.byteLength; i++) {
    view[i] = buf[i];
  }
  return arrayBuffer;
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

    const ab = bufferToArrayBuffer(input.fileBuffer);
    const blob = new Blob([ab], { type: input.mimeType });

    fd.append("file", blob, input.filename);
    fd.append("language", input.language);
    if (input.context) fd.append("context", input.context);

    const res = await fetch(`${this.baseUrl}/transcribe/file`, {
      method: "POST",
      body: fd,
      // IMPORTANTE: no pongas content-type aquí; FormData lo gestiona solo.
    });

    const rawText = await res.text();

    if (!res.ok) {
      // Railway/uvicorn a veces devuelve HTML o texto plano
      throw new Error(`Whisper service error: ${res.status} ${rawText}`);
    }

    let data: unknown = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      throw new Error("Whisper service devolvió una respuesta no JSON.");
    }

    if (isWhisperOk(data)) {
      return {
        text: data.text,
        durationSec: data.durationSec,
        language: data.language,
      };
    }

    if (isWhisperErr(data)) {
      const msg =
        (typeof data.error === "string" && data.error) ||
        (typeof data.detail === "string" && data.detail) ||
        "Whisper transcription failed";
      throw new Error(msg);
    }

    throw new Error("Respuesta inválida del servicio Whisper.");
  }
}
