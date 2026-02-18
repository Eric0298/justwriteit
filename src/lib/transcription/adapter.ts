import { WhisperHttpAdapter, type WhisperSegment } from "./providers/whisper-http";

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
  segments?: WhisperSegment[];
};

function sanitizeBaseUrl(raw: string) {
  const url = raw.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("WHISPER_SERVICE_URL debe empezar por http:// o https://");
  }
  return url;
}

export function getTranscriptionAdapter() {
  const raw = process.env.WHISPER_SERVICE_URL;
  if (!raw) throw new Error("WHISPER_SERVICE_URL no definida");

  const whisperUrl = sanitizeBaseUrl(raw);
  const whisper = new WhisperHttpAdapter(whisperUrl);

  return {
    async transcribeFile(input: TranscribeFileInput): Promise<TranscribeFileOutput> {
      const res = await whisper.transcribeFile(input);
      return {
        text: res.text,
        durationSec: res.durationSec,
        segments: res.segments,
      };
    },
  };
}
