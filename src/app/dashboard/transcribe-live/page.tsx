// src/app/dashboard/transcribe-live/page.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

type Status = "idle" | "recording" | "paused" | "stopping" | "done";

type LiveStartOk = {
  ok: true;
  sessionId: string;
  transcriptionId: string;
};

type LiveStartErr = {
  ok: false;
  error: string;
  details?: unknown;
};

type LiveFinishOk = {
  ok: true;
  transcription?: {
    transcript_text?: string | null;
  };
};

type LiveFinishErr = {
  ok: false;
  error: string;
  details?: unknown;
};

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

export default function TranscribeLivePage() {
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

  React.useEffect(() => {
    if (status !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  function reset() {
    setStatus("idle");
    setSeconds(0);
    setResultText("");
    chunkIndexRef.current = 0;
    sessionIdRef.current = null;
    transcriptionIdRef.current = null;
  }

  async function start() {
    try {
      setResultText("");
      setSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";

      const resStart = await fetch("/api/transcribe/live/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language,
          context,
          mimeType: mimeType || undefined,
        }),
      });

      const startData: unknown = await resStart.json().catch(() => null);

      if (!resStart.ok) {
        const msg = isLiveStartErr(startData)
          ? startData.error
          : "No se pudo iniciar.";
        push({ title: "Error", message: msg, variant: "danger" });
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!isLiveStartOk(startData)) {
        push({ title: "Error", message: "Respuesta inválida del servidor.", variant: "danger" });
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      sessionIdRef.current = startData.sessionId;
      transcriptionIdRef.current = startData.transcriptionId;

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;

      rec.ondataavailable = async (ev) => {
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
          const data: unknown = await res.json().catch(() => null);
          const msg =
            isObject(data) && typeof data.error === "string"
              ? data.error
              : "No se pudo enviar un chunk.";

          push({
            title: "Error enviando audio",
            message: msg,
            variant: "danger",
          });
        }
      };

      rec.start(1000);
      setStatus("recording");
      push({
        title: "Grabación iniciada 🎙️",
        message: "Hablando... enviando audio por chunks.",
        variant: "success",
      });
    } catch (e) {
      push({
        title: "No se pudo acceder al micrófono",
        message: e instanceof Error ? e.message : "Permisos o dispositivo no disponible.",
        variant: "danger",
      });
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

    if (!rec || !sessionId || !transcriptionId) return;

    setStatus("stopping");

    try {
      rec.requestData();
    } catch {
      // ok
    }

    const stopped = new Promise<void>((resolve) => {
      const prev = rec.onstop;
      rec.onstop = (ev: Event) => {
        try {
          if (typeof prev === "function") prev.call(rec, ev);
        } finally {
          resolve();
        }
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

    const finishData: unknown = await resFinish.json().catch(() => null);

    if (!resFinish.ok) {
      const msg = isLiveFinishErr(finishData)
        ? finishData.error
        : "No se pudo finalizar.";
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

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Transcribir en vivo</h1>
          <p className="mt-2 text-sm text-muted">
            Graba audio con el micrófono. Se envía por chunks y al finalizar se genera una transcripción.
          </p>
        </div>
        <Badge>{status}</Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Select
          label="Idioma"
          name="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={[
            { value: "es", label: "Español" },
            { value: "en", label: "Inglés" },
            { value: "ca", label: "Catalán" },
            { value: "fr", label: "Francés" },
          ]}
          disabled={status !== "idle"}
        />

        <Input
          name="context"
          label="Contexto (opcional)"
          placeholder="Ej: entrevista / reunión / clase..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={status !== "idle"}
        />
      </div>

      <div className="mt-6 card p-4 flex items-center justify-between">
        <div className="text-sm">
          <p className="font-medium">Tiempo: {seconds}s</p>
          <p className="text-muted">Estado: {status}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {status === "idle" ? (
            <Button onClick={start} aria-label="Iniciar grabación">
              Grabar
            </Button>
          ) : null}

          {status === "recording" ? (
            <>
              <Button onClick={pause} variant="ghost" aria-label="Pausar grabación">
                Pausar
              </Button>
              <Button onClick={stop} variant="danger" aria-label="Finalizar grabación">
                Finalizar
              </Button>
            </>
          ) : null}

          {status === "paused" ? (
            <>
              <Button onClick={resume} aria-label="Reanudar grabación">
                Reanudar
              </Button>
              <Button onClick={stop} variant="danger" aria-label="Finalizar grabación">
                Finalizar
              </Button>
            </>
          ) : null}

          {status === "done" ? (
            <Button onClick={reset} variant="ghost" aria-label="Nueva grabación">
              Nueva
            </Button>
          ) : null}
        </div>
      </div>

      {resultText ? (
        <div className="mt-6">
          <h2 className="text-sm font-medium">Resultado</h2>
          <pre className="mt-2 whitespace-pre-wrap rounded-md border p-4 text-sm">{resultText}</pre>
        </div>
      ) : null}
    </Card>
  );
}
