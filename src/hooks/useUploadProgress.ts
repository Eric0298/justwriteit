"use client";

import * as React from "react";

export type Phase = "idle" | "uploading" | "transcribing" | "saving" | "done" | "error";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function xhrPostFormData<T>(
  url: string,
  formData: FormData,
  opts: {
    onUploadProgress?: (pct: number) => void;
    signal?: AbortSignal;
  }
): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "text";

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      opts.onUploadProgress?.(clamp(pct, 0, 100));
    };

    xhr.onload = () => {
      const status = xhr.status;
      const raw = xhr.responseText ?? "";
      try {
        const json = raw ? (JSON.parse(raw) as T) : ({} as T);
        resolve({ status, data: json });
      } catch {
        reject(new Error("Respuesta inválida del servidor (no JSON)."));
      }
    };

    xhr.onerror = () => reject(new Error("Error de red al enviar el archivo."));
    xhr.onabort = () => reject(new Error("Solicitud cancelada."));

    if (opts.signal) {
      if (opts.signal.aborted) {
        xhr.abort();
      } else {
        opts.signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }
    }

    xhr.send(formData);
  });
}

export function useUploadProgress() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [progress, setProgress] = React.useState(0);

  const abortRef = React.useRef<AbortController | null>(null);
  const tickRef = React.useRef<number | null>(null);

  function stopFakeTick() {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
  }

  function startFakeTick(from: number, to: number, stepMax = 2) {
    stopFakeTick();
    tickRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + Math.max(1, Math.floor(Math.random() * stepMax));
        return clamp(next, from, to);
      });
    }, 450);
  }

  function reset() {
    stopFakeTick();
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setProgress(0);
  }

  function cancel() {
    abortRef.current?.abort();
    reset();
  }

  async function postForm<T>(url: string, formData: FormData): Promise<{ status: number; data: T }> {
    stopFakeTick();
    setProgress(0);
    setPhase("uploading");

    const ac = new AbortController();
    abortRef.current = ac;

    // Upload real 0..70
    const res = await xhrPostFormData<T>(url, formData, {
      signal: ac.signal,
      onUploadProgress: (pct) => {
        const mapped = Math.round((pct / 100) * 70);
        setProgress(clamp(mapped, 0, 70));
      },
    });

    // Transcribing “smooth” 70..95
    setPhase("transcribing");
    startFakeTick(70, 95, 2);

    return res;
  }

  async function finishOk() {
    // “Guardando” 95..100
    stopFakeTick();
    setPhase("saving");
    setProgress(95);
    await new Promise((r) => setTimeout(r, 250));
    setProgress(100);
    setPhase("done");
  }

  function fail() {
    stopFakeTick();
    setPhase("error");
  }

  const isBusy = phase === "uploading" || phase === "transcribing" || phase === "saving";

  return {
    phase,
    progress,
    isBusy,
    setPhase,
    setProgress,
    postForm,
    finishOk,
    fail,
    reset,
    cancel,
  };
}
