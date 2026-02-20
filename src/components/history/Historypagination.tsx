import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HistoryPaginationProps {
  page: number;
  totalPages: number;
  searchQuery?: string;
}

function buildHref(page: number, searchQuery?: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (searchQuery) params.set("q", searchQuery);
  return `/dashboard/history?${params.toString()}`;
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 4) return Array.from({ length: total }, (_, i) => i + 1);

  let start = Math.max(1, current - 1);
  let end = start + 3;

  if (end > total) {
    end = total;
    start = Math.max(1, end - 3);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

const linkBase =
  "inline-flex items-center justify-center rounded-[var(--radius-md)] border px-3 py-2 text-sm transition min-w-[2.25rem]";
const linkStyle = {
  borderColor: "rgba(var(--accent),0.16)",
  background: "linear-gradient(135deg, rgba(var(--accent),0.10), rgba(var(--card),0.85))",
};

export function HistoryPagination({ page, totalPages, searchQuery }: HistoryPaginationProps) {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:justify-between">
      <Link
        aria-disabled={!canPrev}
        aria-label="Página anterior"
        className={[
          linkBase,
          !canPrev ? "pointer-events-none opacity-50" : "hover:shadow-[var(--shadow-sm)]",
        ].join(" ")}
        style={linkStyle}
        href={buildHref(page - 1, searchQuery)}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span className="hidden sm:inline ml-1">Anterior</span>
      </Link>

      <div className="flex items-center gap-1">
        {pageNumbers.map((p) => (
          <Link
            key={p}
            href={buildHref(p, searchQuery)}
            aria-current={p === page ? "page" : undefined}
            className={[
              linkBase,
              p === page
                ? "font-semibold text-accent shadow-[var(--shadow-sm)]"
                : "hover:shadow-[var(--shadow-sm)] text-muted hover:text-fg",
            ].join(" ")}
            style={
              p === page
                ? {
                    borderColor: "rgba(var(--accent),0.4)",
                    background:
                      "linear-gradient(135deg, rgba(var(--accent),0.18), rgba(var(--card),0.90))",
                  }
                : linkStyle
            }
          >
            {p}
          </Link>
        ))}
      </div>

      <Link
        aria-disabled={!canNext}
        aria-label="Página siguiente"
        className={[
          linkBase,
          !canNext ? "pointer-events-none opacity-50" : "hover:shadow-[var(--shadow-sm)]",
        ].join(" ")}
        style={linkStyle}
        href={buildHref(page + 1, searchQuery)}
      >
        <span className="hidden sm:inline mr-1">Siguiente</span>
        <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}