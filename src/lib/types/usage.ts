export type UsageStatus = {
  userId: string;
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
  resetAt: string;
  maxAudioFileSizeMb: number;
  maxAudioFileSizeBytes: number;
  canTranscribe: boolean;
  message: string;
};
