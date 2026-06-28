"use client";

import * as React from "react";
import { useToast } from "@/components/ui/Toast";
import type { UsageStatus } from "@/lib/types/usage";

export type Status = "idle" | "recording" | "paused" | "stopping" | "done";

type LiveStartOk = { ok: true; sessionId: string; transcriptionId: string; usage?: UsageStatus };
type LiveStartErr = { ok: false; error: string; details?: unknown; usage?: UsageStatus };

type LiveFinishOk = { ok: true; transcription?: { transcript_text?: string | null }; usage?: UsageStatus };
type LiveFinishErr = { ok: false; error: string; details?: unknown; usage?: UsageStatus };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUsageStatus(v: unknown): v is UsageStatus {
  return (
    isObject(v) &&
    typeof v.plan === "string" &&
    typeof v.remainingToday === "number" &&
    typeof v.dailyLimit === "number" &&
    typeof v.maxAudioFileSizeBytes === "number" &&
    typeof v.canTranscribe === "boolean" &&
    typeof v.message === "string"
  );
}

function isLiveStartOk(v: unknown): v is LiveStartOk {
  return (
    isObject(v) &&
    v.ok === true &&
    typeof v.sessionId === "string" &&
    typeof v.transcriptionId === "string"
  );
}

function isLiveStartErr(v: unknown): v is LiveStartErr {
  return isObject(v) && v.ok === false && typeof v.error === "string";
}

function isLiveFinishOk(v: unknown): v is LiveFinishOk {
  return isObject(v) && v.ok === true;
}

function isLiveFinishErr(v: unknown): v is LiveFinishErr {
  return isObject(v) && v.ok === false && typeof v.error === "string";
}

async function readJsonOrText(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => null);
  }
  const text = await res.text().catch(() => "");
  return { ok: false, error: text || "Respuesta no JSON" };
}

export function useLiveTranscription() {
  const { push } = useToast();

  const [status, setStatus] = React.useState<Status>("idle");
  const [language, setLanguage] = React.useState("es");
  const [context, setContext] = React.useState("");
  const [seconds, setSeconds] = React.useState(0);
  const [resultText, setResultText] = React.useState<string>("");
  const [usage, setUsage] = React.useState<UsageStatus | null>(null);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunkIndexRef = React.useRef(0);

  const sessionIdRef = React.useRef<string | null>(null);
  const transcriptionIdRef = React.useRef<string | null>(null);

  const refreshUsage = React.useCallback(async () => {
    const res = await fetch("/api/usage/today", { cache: "no-store" });
    const data = await readJsonOrText(res);
    if (isObject(data) && isUsageStatus(data.usage)) {
      setUsage(data.usage);
    }
  }, []);

  React.useEffect(() => {
    void refreshUsage();
  }, [refreshUsage]);

  React.useEffect(() => {
    if (status !== "recording") return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [status]);

  function reset() {
    setStatus("idle");
    setSeconds(0);
    setResultText("");
    chunkIndexRef.current = 0;
    sessionIdRef.current = null;
    transcriptionIdRef.current = null;
    recorderRef.current = null;
    streamRef.current = null;
    void refreshUsage();
  }

  async function start() {
    if (status !== "idle") return;

    if (usage && !usage.canTranscribe) {
      push({ title: "Limite diario alcanzado", message: usage.message, variant: "danger" });
      return;
    }

    let stream: MediaStream | null = null;

    try {
      setResultText("");
      setSeconds(0);

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMime = "audio/webm";
      const mimeType = MediaRecorder.isTypeSupported(preferredMime) ? preferredMime : "";

      const resStart = await fetch("/api/transcribe/live/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language, context, mimeType: mimeType || undefined }),
      });

      const startData = await readJsonOrText(resStart);

      if (isObject(startData) && isUsageStatus(startData.usage)) {
        setUsage(startData.usage);
      }

      if (!resStart.ok) {
        const msg = isLiveStartErr(startData) ? startData.error : "No se pudo iniciar.";
        push({ title: "Error", message: msg, variant: "danger" });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      if (!isLiveStartOk(startData)) {
        push({ title: "Error", message: "Respuesta invalida del servidor.", variant: "danger" });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      sessionIdRef.current = startData.sessionId;
      transcriptionIdRef.current = startData.transcriptionId;

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;

      rec.ondataavailable = async (ev: BlobEvent) => {
        if (!ev.data || ev.data.size === 0) return;

        const sessionId = sessionIdRef.current;
        if (!sessionId) return;

        const fd = new FormData();
        fd.append("sessionId", sessionId);
        fd.append("chunkIndex", String(chunkIndexRef.current));
        fd.append("chunk", ev.data, `chunk-${chunkIndexRef.current}.webm`);

        chunkIndexRef.current += 1;

        const res = await fetch("/api/transcribe/live/chunk", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await readJsonOrText(res);
          const msg =
            isObject(data) && typeof data.error === "string"
              ? data.error
              : "No se pudo enviar un chunk.";
          push({ title: "Error enviando audio", message: msg, variant: "danger" });
        }
      };

      rec.start(1000);
      setStatus("recording");
      push({
        title: "Grabacion iniciada",
        message: "Hablando... enviando audio por chunks.",
        variant: "success",
      });
    } catch (e: unknown) {
      stream?.getTracks().forEach((t) => t.stop());
      push({
        title: "No se pudo acceder al microfono",
        message: e instanceof Error ? e.message : "Permisos o dispositivo no disponible.",
        variant: "danger",
      });
      setStatus("idle");
      await refreshUsage().catch(() => undefined);
    }
  }

  function pause() {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "recording") return;
    rec.pause();
    setStatus("paused");
  }

  function resume() {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "paused") return;
    rec.resume();
    setStatus("recording");
  }

  async function stop() {
    const rec = recorderRef.current;
    const stream = streamRef.current;

    const sessionId = sessionIdRef.current;
    const transcriptionId = transcriptionIdRef.current;

    if (!rec || !sessionId || !transcriptionId) {
      push({ title: "Error", message: "Falta sessionId/transcriptionId.", variant: "danger" });
      return;
    }

    if (status === "stopping") return;
    setStatus("stopping");

    try {
      rec.requestData();
    } catch {
      // Best effort flush.
    }

    const stopped = new Promise<void>((resolve) => {
      const prev = rec.onstop;
      rec.onstop = (ev: Event) => {
        if (typeof prev === "function") prev.call(rec, ev);
        resolve();
      };
    });

    rec.stop();
    stream?.getTracks().forEach((t) => t.stop());
    await stopped;
    await new Promise((r) => setTimeout(r, 300));

    const resFinish = await fetch("/api/transcribe/live/finish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, transcriptionId }),
    });

    const finishData = await readJsonOrText(resFinish);
    if (isObject(finishData) && isUsageStatus(finishData.usage)) {
      setUsage(finishData.usage);
    }

    if (!resFinish.ok) {
      const msg = isLiveFinishErr(finishData) ? finishData.error : "No se pudo finalizar.";
      push({ title: "Error", message: msg, variant: "danger" });
      setStatus("idle");
      return;
    }

    if (!isLiveFinishOk(finishData)) {
      push({ title: "Error", message: "Respuesta invalida del servidor.", variant: "danger" });
      setStatus("idle");
      return;
    }

    const text = finishData.transcription?.transcript_text ?? "";
    setResultText(text ?? "");
    setStatus("done");

    push({ title: "Transcripcion lista", message: "Guardada en tu historial.", variant: "success" });
  }

  const canFinish = status === "recording" || status === "paused";
  const canEditSettings = status === "idle";

  return {
    status,
    language,
    context,
    seconds,
    resultText,
    usage,
    setLanguage,
    setContext,
    start,
    pause,
    resume,
    stop,
    reset,
    canFinish,
    canEditSettings,
  };
}

