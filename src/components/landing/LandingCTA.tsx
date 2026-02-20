import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function LandingCTA() {
  return (
    <section className="hero-card p-6 sm:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Empieza en 30 segundos
          </h2>
          <p className="mt-1 text-sm text-muted max-w-[70ch]">
            Crea tu cuenta, sube un audio o graba en vivo, y guarda todo en tu historial para volver cuando quieras.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/register">
            <Button>
              Crear cuenta <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Ya tengo cuenta</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}