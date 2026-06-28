export type WhisperSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

export type Transcription = {
  id: string;
  status: string;
  language: string;
  audio_filename: string | null;
  audio_url: string | null;
  duration: number | null;
  file_size_bytes: number | null;
  transcript_text: string | null;
  segments: WhisperSegment[] | null;
  is_free_usage: boolean;
  plan: string;
  created_at: string;
};
