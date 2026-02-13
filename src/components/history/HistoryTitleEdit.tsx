"use client";

import * as React from "react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

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
    } catch (error) {
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
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="w-full rounded border px-2 py-1 text-sm font-medium outline-none focus:ring-2 focus:ring-accent"
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-full text-left font-medium underline underline-offset-4 hover:text-accent"
      title="Click para editar título"
    >
      {currentTitle}
    </button>
  );
}