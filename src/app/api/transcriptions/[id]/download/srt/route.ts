import { auth } from "@/../auth";
import { getUserTranscriptionById } from "@/lib/queries/transcriptions";

export const runtime = "nodejs";

type WhisperSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function isSegment(v: unknown): v is WhisperSegment {
  return (
    isObject(v) &&
    typeof v.id === "number" &&
    typeof v.start === "number" &&
    typeof v.end === "number" &&
    typeof v.text === "string"
  );
}

function normalizeSegments(raw: unknown): WhisperSegment[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isSegment) : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw.filter(isSegment);
  return [];
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function pad3(n: number) {
  return String(n).padStart(3, "0");
}

// SRT uses: 00:00:12,345
function formatSrtTime(sec: number) {
  const s = Math.max(0, sec);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 1000);
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)},${pad3(ms)}`;
}

function cleanText(t: string) {
  return t
    .replace(/\s+/g, " ")
    .replace(/\u200b/g, "")
    .trim();
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("No autenticado", { status: 401 });

  const { id } = await ctx.params;

  const row = await getUserTranscriptionById({ userId: session.user.id, id });
  if (!row) return new Response("No encontrado", { status: 404 });

  const segments = normalizeSegments(row.segments);
  if (segments.length === 0) {
    return new Response("Esta transcripción no tiene segmentos guardados.", { status: 400 });
  }

  const lines: string[] = [];
  let i = 1;

  for (const s of segments) {
    const text = cleanText(s.text);
    if (!text) continue;

    lines.push(String(i++));
    lines.push(`${formatSrtTime(s.start)} --> ${formatSrtTime(s.end)}`);
    lines.push(text);
    lines.push("");
  }

  const safeName = `justwriteit-${row.type}-${row.id}.srt`;
  const content = lines.join("\n");

  return new Response(content, {
    headers: {
      "content-type": "application/x-subrip; charset=utf-8",
      "content-disposition": `attachment; filename="${safeName}"`,
    },
  });
}
