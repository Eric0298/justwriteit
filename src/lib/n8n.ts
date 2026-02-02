// src/lib/n8n.ts
import crypto from "crypto";

type NotifyPayload = {
  transcriptionId: string;
  userEmail: string;
  userName: string;
  language: string;
  type: string;
  createdAt: string;
  textSnippet: string;
  detailUrl: string;
};

function stableStringify(value: unknown): string {
  // Soporta Date por si se cuela alguno
  if (value instanceof Date) return JSON.stringify(value.toISOString());

  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

function signPayload(payload: NotifyPayload, secret: string, timestamp: string) {
  const rawBody = stableStringify(payload);
  const base = `${timestamp}.${rawBody}`;
  const hmac = crypto.createHmac("sha256", secret).update(base).digest("hex");
  return { rawBody, signature: `sha256=${hmac}` };
}

export async function notifyTranscriptionCompleted(payload: NotifyPayload): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  const url = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!url || !secret) {
    // No rompemos: si no hay config, consideramos "skipped"
    return { ok: false, error: "N8N no configurado (faltan env vars)." };
  }

  const timestamp = String(Date.now());
  const { rawBody, signature } = signPayload(payload, secret, timestamp);

  // Timeout “manual”
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-jwi-timestamp": timestamp,
        "x-jwi-signature": signature,
      },
      body: rawBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: text || "n8n respondió con error" };
    }

    return { ok: true, status: res.status };
  } catch (err) {
    clearTimeout(timeout);
    const message =
      err instanceof Error ? err.message : "Error llamando al webhook de n8n";
    console.error("n8n webhook failed:", message);
    return { ok: false, error: message };
  }
}
