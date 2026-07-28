"use client";

import * as React from "react";
import { useLiveTranscription } from "@/components/transcribe-live/hooks/useLiveTranscription";
import { LiveHeader } from "@/components/transcribe-live/LiveHeader";
import { LiveSettings } from "@/components/transcribe-live/LiveSettings";
import { LiveControls } from "@/components/transcribe-live/LiveControls";
import { LiveResult } from "@/components/transcribe-live/LiveResult";
import { UsageNotice } from "@/components/usage/UsageNotice";

export default function TranscribeLivePage() {
  const live = useLiveTranscription();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <LiveHeader status={live.status} seconds={live.seconds} />

      <UsageNotice usage={live.usage} />

      <LiveSettings
        language={live.language}
        setLanguage={live.setLanguage}
        context={live.context}
        setContext={live.setContext}
        disabled={!live.canEditSettings}
      />

      <LiveControls
        status={live.status}
        canFinish={live.canFinish}
        onStart={live.start}
        onPause={live.pause}
        onResume={live.resume}
        onStop={live.stop}
        onReset={live.reset}
      />

      <LiveResult text={live.resultText} />
    </div>
  );
}
