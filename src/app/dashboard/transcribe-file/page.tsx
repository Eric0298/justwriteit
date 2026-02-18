"use client";

import * as React from "react";
import { TranscriptionProgress } from "@/components/transcribe/TranscriptionProgress";
import { TranscribeFileForm } from "@/components/transcribe/TranscribeFileForm";
import { TranscriptionResultCard } from "@/components/transcribe/TranscriptionResultCard";
import { useFileTranscription } from "@/components/transcribe-file/hooks/useFileTranscription";

export default function TranscribeFilePage() {
  const t = useFileTranscription();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <TranscribeFileForm
        statusBadge={t.result?.status ?? "—"}
        isLoading={t.isLoading}
        file={t.file}
        setFile={t.setFile}
        language={t.language}
        setLanguage={t.setLanguage}
        context={t.context}
        setContext={t.setContext}
        onSubmit={t.submit}
      />

      {(t.isLoading || t.phase === "done" || t.phase === "error") && (
        <TranscriptionProgress
          phase={t.phase}
          progress={t.progress}
          isBusy={t.isLoading}
          onCancel={t.cancel}
        />
      )}

      {t.result?.transcript_text && (
        <TranscriptionResultCard
          result={t.result}
          fallbackAudioUrl={t.lastAudioUrl}
          segmentsRaw={t.segmentsRaw}
        />
      )}
    </div>
  );
}
