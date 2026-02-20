"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useRef } from "react";
import { Search } from "lucide-react";

export function HistorySearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 350);
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <span
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted"
        aria-hidden="true"
      >
        <Search size={15} />
      </span>
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Buscar por nombre…"
        className={[
          "w-full rounded-[var(--radius-md)] border bg-transparent py-2 pl-9 pr-3 text-sm outline-none",
          "placeholder:text-muted focus:ring-1",
          "transition",
          isPending ? "opacity-60" : "",
        ].join(" ")}
        style={{
          borderColor: "rgba(var(--accent),0.22)",
        }}
      />
    </div>
  );
}