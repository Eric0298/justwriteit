import { WhisperHttpAdapter } from "./providers/whisper-http";

type TranscribeFileInput = {
  fileBuffer: Buffer;
  filename: string;
  mimeType: string;
  language: string;
  context?: string;
};

type TranscribeFileOutput = {
  text: string;
  durationSec: number;
};

export function getTranscriptionAdapter() {
  const whisperUrl = process.env.WHISPER_SERVICE_URL;

  if (!whisperUrl) {
    throw new Error("WHISPER_SERVICE_URL no definida");
  }

  const whisper = new WhisperHttpAdapter(whisperUrl);

  return {
    async transcribeFile(input: TranscribeFileInput): Promise<TranscribeFileOutput> {
      const res = await whisper.transcribeFile(input);

      return {
        text: res.text,
        durationSec: res.durationSec,
      };
    },
  };
}
