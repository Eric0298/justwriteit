import Link from "next/link";
import { auth } from "@/../auth";
import { listUserTranscriptions } from "@/lib/queries/transcriptions";
import { countUserTranscriptions } from "@/lib/queries/transcription-extra";
import { Card } from "@/components/ui/Card";
import { redirect } from "next/navigation";
import { HistorySearchInput } from "@/components/history/Historysearchinput";
import { HistoryPagination } from "@/components/history/Historypagination";
import { HistoryList } from "@/components/history/Historylist";
import { History as HistoryIcon, Sparkles } from "lucide-react";
import { Suspense } from "react";

const PAGE_SIZE = 10;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const searchQuery = sp.q?.trim() ?? "";
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    listUserTranscriptions({
      userId: session.user.id,
      limit: PAGE_SIZE,
      offset,
      search: searchQuery || undefined,
    }),
    countUserTranscriptions({
      userId: session.user.id,
      search: searchQuery || undefined,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card className="p-4 sm:p-6 min-w-0 overflow-x-hidden">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2">
            <span
              className="grid h-10 w-10 place-items-center rounded-[14px] border"
              style={{
                borderColor: "rgba(var(--accent),0.22)",
                background:
                  "linear-gradient(135deg, rgba(var(--accent),0.14), rgba(var(--accent-2),0.10))",
              }}
              aria-hidden="true"
            >
              <HistoryIcon size={18} />
            </span>

            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">Historial</h1>
              <p className="mt-1 text-sm text-muted">
                Todas tus transcripciones (archivo y en vivo), ordenadas por fecha.
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border px-3 py-2 text-sm sm:justify-end"
          style={{
            borderColor: "rgba(var(--accent),0.18)",
            background:
              "linear-gradient(180deg, rgba(var(--card),0.95), rgba(var(--card),0.75))",
          }}
        >
          <span className="inline-flex items-center gap-2 text-muted">
            <Sparkles size={16} aria-hidden="true" />
            Total
          </span>
          <span className="text-fg font-semibold">{total}</span>
        </div>
      </div>

      {/* ===== Search ===== */}
      <div className="mt-4">
        {/* Suspense needed because HistorySearchInput uses useSearchParams */}
        <Suspense>
          <HistorySearchInput defaultValue={searchQuery} />
        </Suspense>
      </div>

      {/* ===== Empty state ===== */}
      {rows.length === 0 ? (
        <div
          className="mt-6 rounded-[var(--radius-lg)] border p-5 text-sm"
          style={{
            borderColor: "rgba(var(--accent),0.18)",
            background:
              "linear-gradient(135deg, rgba(var(--accent),0.10), rgba(var(--card),0.90))",
          }}
        >
          {searchQuery ? (
            <p className="text-fg font-medium">
              No se encontraron transcripciones para{" "}
              <span className="text-accent">&ldquo;{searchQuery}&rdquo;</span>.
            </p>
          ) : (
            <>
              <p className="text-fg font-medium">Aún no tienes transcripciones.</p>
              <p className="mt-2 text-muted">
                Empieza por{" "}
                <Link
                  className="underline underline-offset-4 hover:text-accent"
                  href="/dashboard/transcribe-file"
                >
                  transcribir un archivo
                </Link>{" "}
                o{" "}
                <Link
                  className="underline underline-offset-4 hover:text-accent"
                  href="/dashboard/transcribe-live"
                >
                  transcribir en vivo
                </Link>
                .
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <HistoryList rows={rows} />

          <HistoryPagination
            page={page}
            totalPages={totalPages}
            searchQuery={searchQuery}
          />
        </>
      )}
    </Card>
  );
}