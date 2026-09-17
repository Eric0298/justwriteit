export class WhisperColdStartError extends Error {
  constructor(message = "Whisper service no despertó a tiempo.") {
    super(message);
    this.name = "WhisperColdStartError";
  }
}

export class WhisperPayloadTooLargeError extends Error {
  constructor(message = "Audio demasiado grande o largo para el servicio Whisper.") {
    super(message);
    this.name = "WhisperPayloadTooLargeError";
  }
}

export type WhisperSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

export type WhisperTranscribeResult = {
  text: string;
  durationSec: number;
  language: string;
  segments?: WhisperSegment[]; 
  rawText?: string;           
};

type WhisperOk = {
  ok: true;
  text: string;
  durationSec: number;
  language: string;
  segments?: WhisperSegment[];
  rawText?: string;
};

type WhisperErr = {
  ok: false;
  detail?: string;
  error?: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isSegment(v: unknown): v is WhisperSegment {
  if (!isObject(v)) return false;
  return (
    isNumber(v.id) &&
    isNumber(v.start) &&
    isNumber(v.end) &&
    isString(v.text)
  );
}

function isWhisperOk(v: unknown): v is WhisperOk {
  if (
    !(
      isObject(v) &&
      v.ok === true &&
      typeof v.text === "string" &&
      typeof v.durationSec === "number" &&
      typeof v.language === "string"
    )
  ) {
    return false;
  }

const segs = (v as Record<string, unknown>).segments;  if (segs === undefined) return true;
  if (!Array.isArray(segs)) return false;
  return segs.every(isSegment);
}

function isWhisperErr(v: unknown): v is WhisperErr {
  return isObject(v) && v.ok === false;
}

function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buf.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buf.byteLength; i++) {
    view[i] = buf[i];
  }
  return arrayBuffer;
}

const WARMUP_TOTAL_MS = 90_000;
const WARMUP_ATTEMPT_TIMEOUT_MS = 10_000;
const WARMUP_GAP_MS = 5_000;
const TRANSCRIBE_TIMEOUT_MS = 240_000;

export class WhisperHttpAdapter {
  private baseUrl: string;
  private serviceToken?: string;

  constructor(input: { baseUrl: string; serviceToken?: string }) {
    this.baseUrl = input.baseUrl.replace(/\/$/, "");
    this.serviceToken = input.serviceToken?.trim() || undefined;
  }

  private authHeaders(): Record<string, string> | undefined {
    return this.serviceToken
      ? { authorization: `Bearer ${this.serviceToken}` }
      : undefined;
  }

  async warmUp(): Promise<void> {
    const start = Date.now();
    let lastStatus = 0;
    let lastError: unknown = null;

    while (Date.now() - start < WARMUP_TOTAL_MS) {
      try {
        const res = await fetch(`${this.baseUrl}/health`, {
          method: "GET",
          headers: this.authHeaders(),
          signal: AbortSignal.timeout(WARMUP_ATTEMPT_TIMEOUT_MS),
        });

        if (res.ok) return;

        lastStatus = res.status;
        // 4xx no se resuelve reintentando (auth, ruta mal configurada...).
        // 5xx incluye 502/503/504 típicos de arranque, pero también 500 durante boot.
        if (res.status < 500) {
          throw new WhisperColdStartError(
            `Whisper /health devolvió ${res.status}.`
          );
        }
      } catch (err) {
        if (err instanceof WhisperColdStartError) throw err;
        // AbortError/TimeoutError del intento, ECONNREFUSED, ENOTFOUND, TLS, etc. → reintentar.
        lastError = err;
      }

      if (Date.now() - start + WARMUP_GAP_MS >= WARMUP_TOTAL_MS) break;
      await new Promise((resolve) => setTimeout(resolve, WARMUP_GAP_MS));
    }

    const suffix = lastStatus
      ? `último status ${lastStatus}`
      : lastError instanceof Error
        ? lastError.message
        : "sin respuesta";
    throw new WhisperColdStartError(
      `Whisper service no despertó tras ${Math.round(WARMUP_TOTAL_MS / 1000)} s (${suffix}).`
    );
  }

  async transcribeFile(input: {
    fileBuffer: Buffer;
    filename: string;
    mimeType: string;
    language: string;
    context?: string;
    timeoutMs?: number;
  }): Promise<WhisperTranscribeResult> {
    const fd = new FormData();

    const ab = bufferToArrayBuffer(input.fileBuffer);
    const blob = new Blob([ab], { type: input.mimeType });

    fd.append("file", blob, input.filename);
    fd.append("language", input.language);
    if (input.context) fd.append("context", input.context);

    const timeoutMs = input.timeoutMs ?? TRANSCRIBE_TIMEOUT_MS;
    const res = await fetch(`${this.baseUrl}/transcribe/file`, {
      method: "POST",
      headers: this.authHeaders(),
      body: fd,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const rawText = await res.text();

    if (res.status === 413) {
      let msg = "El audio supera el tamaño o duración permitidos por el servicio.";
      try {
        const parsed = rawText ? (JSON.parse(rawText) as unknown) : null;
        if (isObject(parsed)) {
          const detail = parsed.detail;
          const errorField = parsed.error;
          if (isString(detail) && detail) msg = detail;
          else if (isString(errorField) && errorField) msg = errorField;
        }
      } catch {
        // conserva el mensaje por defecto
      }
      throw new WhisperPayloadTooLargeError(msg);
    }

    if (!res.ok) {
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
        segments: data.segments,   
        rawText: data.rawText,     
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
