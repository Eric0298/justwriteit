export type TranscriptionAdapterOutput = {
  text: string;
  durationSec?: number;
};

export type TranscriptionAdapterInput = {
  fileBuffer: Buffer;
  filename: string;
  mimeType: string;
  language: string;
  context?: string;
};

export type LiveTranscriptionAdapterInput = {
  audioBuffer: Buffer;
  mimeType: string;
  language: string;
  context?: string;
};

export interface TranscriptionAdapter {
  transcribeFile(input: TranscriptionAdapterInput): Promise<TranscriptionAdapterOutput>;
  transcribeLive(input: LiveTranscriptionAdapterInput): Promise<TranscriptionAdapterOutput>;
}

export class MockTranscriptionAdapter implements TranscriptionAdapter {
  async transcribeFile(input: TranscriptionAdapterInput): Promise<TranscriptionAdapterOutput> {
    const kb = Math.round(input.fileBuffer.length / 1024);

    return {
      text:
        `✅ (MOCK) Transcripción simulada (archivo)\n` +
        `Archivo: ${input.filename} (${kb} KB)\n` +
        `Tipo: ${input.mimeType}\n` +
        `Idioma: ${input.language}\n` +
        `Contexto: ${input.context ?? "—"}\n\n` +
        `Esto es un texto simulado. Cuando conectemos un proveedor real, aquí irá la transcripción real.`,
      durationSec: 42,
    };
  }

  async transcribeLive(input: LiveTranscriptionAdapterInput): Promise<TranscriptionAdapterOutput> {
    const kb = Math.round(input.audioBuffer.length / 1024);

    return {
      text:
        `🎙️ (MOCK) Transcripción simulada (en vivo)\n` +
        `Audio total recibido: ${kb} KB\n` +
        `Tipo: ${input.mimeType}\n` +
        `Idioma: ${input.language}\n` +
        `Contexto: ${input.context ?? "—"}\n\n` +
        `Aquí irá la transcripción real cuando conectemos un proveedor streaming.`,
      durationSec: 18,
    };
  }
}

export function getTranscriptionAdapter(): TranscriptionAdapter {
  return new MockTranscriptionAdapter();
}
