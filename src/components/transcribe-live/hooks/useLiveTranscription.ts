"use client";

import * as React from "react";
import { useToast } from "@/components/ui/Toast";

export type Status = "idle" | "recording" | "paused" | "stopping" | "done";

type LiveStartOk = { ok: true; sessionId: string; transcriptionId: string };
type LiveStartErr = { ok: false; error: string; details?: unknown };

type LiveFinishOk = { ok: true; transcription?: { transcript_text?: string | null } };
type LiveFinishErr = { ok: false; error: string; details?: unknown };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

/** Lee respuesta: intenta JSON y si no puede, devuelve texto */
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

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunkIndexRef = React.useRef(0);

  const sessionIdRef = React.useRef<string | null>(null);
  const transcriptionIdRef = React.useRef<string | null>(null);

  // Timer
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
  }

  async function start() {
    if (status !== "idle") return;

    try {
      setResultText("");
      setSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMime = "audio/webm";
      const mimeType = MediaRecorder.isTypeSupported(preferredMime) ? preferredMime : "";

      // 1) crear sesión
      const resStart = await fetch("/api/transcribe/live/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language, context, mimeType: mimeType || undefined }),
      });

      const startData: unknown = await readJsonOrText(resStart);

      if (!resStart.ok) {
        const msg = isLiveStartErr(startData) ? startData.error : "No se pudo iniciar.";
        push({ title: "Error", message: msg, variant: "danger" });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      if (!isLiveStartOk(startData)) {
        push({ title: "Error", message: "Respuesta inválida del servidor.", variant: "danger" });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }

      sessionIdRef.current = startData.sessionId;
      transcriptionIdRef.current = startData.transcriptionId;

      // 2) MediaRecorder
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
          const data: unknown = await readJsonOrText(res);
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
        title: "Grabación iniciada 🎙️",
        message: "Hablando... enviando audio por chunks.",
        variant: "success",
      });
    } catch (e: unknown) {
      push({
        title: "No se pudo acceder al micrófono",
        message: e instanceof Error ? e.message : "Permisos o dispositivo no disponible.",
        variant: "danger",
      });
      setStatus("idle");
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

    // fuerza flush del último chunk
    try {
      rec.requestData();
    } catch {
      // ok
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

    // pequeña espera por si el último chunk llega tarde
    await new Promise((r) => setTimeout(r, 300));

    const resFinish = await fetch("/api/transcribe/live/finish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, transcriptionId }),
    });

    const finishData: unknown = await readJsonOrText(resFinish);

    if (!resFinish.ok) {
      const msg = isLiveFinishErr(finishData) ? finishData.error : "No se pudo finalizar.";
      push({ title: "Error", message: msg, variant: "danger" });
      setStatus("idle");
      return;
    }

    if (!isLiveFinishOk(finishData)) {
      push({ title: "Error", message: "Respuesta inválida del servidor.", variant: "danger" });
      setStatus("idle");
      return;
    }

    const text = finishData.transcription?.transcript_text ?? "";
    setResultText(text ?? "");
    setStatus("done");

    push({ title: "Transcripción lista ✅", message: "Guardada en tu historial.", variant: "success" });
  }

  const canFinish = status === "recording" || status === "paused";
  const canEditSettings = status === "idle";

  return {
    // state
    status,
    language,
    context,
    seconds,
    resultText,

    // setters
    setLanguage,
    setContext,

    // actions
    start,
    pause,
    resume,
    stop,
    reset,

    // derived
    canFinish,
    canEditSettings,
  };
}
