import Link from "next/link";

const mock = [
  { id: "a1", title: "Reunión cliente", date: "2026-01-19" },
  { id: "b2", title: "Ideas artículo", date: "2026-01-18" },
  { id: "c3", title: "Notas rápidas", date: "2026-01-17" },
];

export default function HistoryPage() {
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold">Historial</h1>
      <p className="mt-2 text-sm text-muted">
        Lista de transcripciones guardadas (mock por ahora).
      </p>

      <div className="mt-6 grid gap-3">
        {mock.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/history/${item.id}`}
            className="rounded-md border p-4 transition hover:bg-black/5 dark:hover:bg-white/10"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted">{item.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
