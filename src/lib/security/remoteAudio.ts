import { PublicApiError } from "@/lib/api/errors";

const DEFAULT_ALLOWED_SUFFIXES = [".public.blob.vercel-storage.com"];

function parseAllowedHosts(): string[] {
  return (process.env.ALLOWED_AUDIO_SOURCE_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const explicitHosts = parseAllowedHosts();

  if (explicitHosts.includes(host)) return true;
  if (DEFAULT_ALLOWED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;

  if (process.env.NODE_ENV !== "production") {
    return host === "localhost" || host === "127.0.0.1";
  }

  return false;
}

export function assertAllowedRemoteAudioUrl(rawUrl: string): string {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new PublicApiError("URL de audio invalida.", 400);
  }

  if (url.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new PublicApiError("La URL de audio debe usar HTTPS.", 400);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new PublicApiError("Protocolo de audio no permitido.", 400);
  }

  if (!isAllowedHost(url.hostname)) {
    throw new PublicApiError("Origen del audio no permitido.", 400);
  }

  return url.toString();
}

