export type TranscriptionAdapterInput = {
  fileBuffer: Buffer;
  filename: string;
  mimeType: string;
  language: string;
  context?: string;
};

export type TranscriptionAdapterOutput = {
  text: string;
  durationSec?: number;
};

export interface TranscriptionAdapter {
  transcribeFile(input: TranscriptionAdapterInput): Promise<TranscriptionAdapterOutput>;
}

export class MockTranscriptionAdapter implements TranscriptionAdapter {
  async transcribeFile(input: TranscriptionAdapterInput): Promise<TranscriptionAdapterOutput> {
    const kb = Math.round(input.fileBuffer.length / 1024);

    return {
      text:
        ` (MOCK) Transcripción simulada\n` +
        `Archivo: ${input.filename} (${kb} KB)\n` +
        `Tipo: ${input.mimeType}\n` +
        `Idioma: ${input.language}\n` +
        `Contexto: ${input.context ?? "—"}\n\n` +
        `Esto es un texto simulado. Cuando conectemos un proveedor real, aquí irá la transcripción real.`,
      durationSec: 42,
    };
  }
}

export function getTranscriptionAdapter(): TranscriptionAdapter {
  // En PRO: aquí se cambiara por Whisper / Deepgram / AssemblyAI, etc.
  return new MockTranscriptionAdapter();
}
