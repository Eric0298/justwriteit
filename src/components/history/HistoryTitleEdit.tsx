"use client";

import * as React from "react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { PencilLine, Check, X } from "lucide-react";

type Props = {
  id: string;
  currentTitle: string;
};

export function HistoryTitleEdit({ id, currentTitle }: Props) {
  const { push } = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = React.useState(false);
  const [title, setTitle] = React.useState(currentTitle);
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  async function handleSave() {
    if (title.trim() === currentTitle) {
      setIsEditing(false);
      return;
    }

    if (!title.trim()) {
      push({
        title: "Error",
        message: "El título no puede estar vacío",
        variant: "danger",
      });
      setTitle(currentTitle);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/transcriptions/${id}/title`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        push({
          title: "Error",
          message: data?.error ?? "No se pudo actualizar",
          variant: "danger",
        });
        setTitle(currentTitle);
        return;
      }

      push({
        title: "Actualizado",
        message: "Título actualizado correctamente",
        variant: "success",
      });

      router.refresh();
      setIsEditing(false);
    } catch {
      push({
        title: "Error",
        message: "Error inesperado",
        variant: "danger",
      });
      setTitle(currentTitle);
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setTitle(currentTitle);
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="input h-10 text-sm font-semibold"
          aria-label="Editar título"
        />

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => handleSave()}
          disabled={isSaving}
          aria-label="Guardar título"
          title="Guardar"
        >
          <Check size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setTitle(currentTitle);
            setIsEditing(false);
          }}
          disabled={isSaving}
          aria-label="Cancelar edición"
          title="Cancelar"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex w-full items-center gap-2 text-left"
      title="Click para editar título"
      type="button"
    >
      <span className="min-w-0 truncate text-base font-semibold underline underline-offset-4 group-hover:text-accent">
        {currentTitle}
      </span>
      <span
        className="grid h-8 w-8 place-items-center rounded-[12px] border opacity-0 transition group-hover:opacity-100"
        style={{
          borderColor: "rgba(var(--accent),0.22)",
          background: "rgba(var(--accent),0.08)",
        }}
        aria-hidden="true"
      >
        <PencilLine size={16} />
      </span>
    </button>
  );
}
