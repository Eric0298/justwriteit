// src/lib/transcription/providers/whisper-http.ts

export type WhisperTranscribeResult = {
  text: string;
  durationSec: number;
  language: string;
};

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

    // ✅ TS-friendly: Buffer -> Uint8Array -> BlobPart válido
    const blob = new Blob([new Uint8Array(input.fileBuffer)], { type: input.mimeType });

    fd.append("file", blob, input.filename);
    fd.append("language", input.language);
    if (input.context) fd.append("context", input.context);

    const res = await fetch(`${this.baseUrl}/transcribe/file`, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Whisper service error: ${res.status} ${txt}`);
    }

    const data = await res.json();

    if (!data.ok) {
      throw new Error("Whisper transcription failed");
    }

    return {
      text: data.text,
      durationSec: data.durationSec,
      language: data.language,
    };
  }
}
