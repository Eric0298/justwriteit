"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function UiKitPage() {
  const { push } = useToast();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>UI Kit</CardTitle>
            <Badge variant="accent">Accesible</Badge>
            <Badge variant="outline">Tailwind v4</Badge>
          </div>
          <CardDescription>
            Ejemplos reales de uso de los componentes del mini design system.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6">
          {/* Buttons */}
          <div className="grid gap-3">
            <p className="text-sm font-medium">Buttons</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => push({ title: "Acción primaria", message: "Botón primary" })}>
                Primary
              </Button>
              <Button
                variant="ghost"
                onClick={() => push({ title: "Acción secundaria", message: "Botón ghost" })}
              >
                Ghost
              </Button>
              <Button
                variant="danger"
                onClick={() => push({ title: "Acción peligrosa", message: "Botón danger", variant: "danger" })}
              >
                Danger
              </Button>
              <Button isLoading>Guardando</Button>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid gap-3">
            <p className="text-sm font-medium">Inputs</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" placeholder="ejemplo@justwriteit.com" hint="Usaremos esto para tu cuenta." />
              <Input label="Contraseña" type="password" placeholder="••••••••" error="La contraseña es obligatoria." />
            </div>
          </div>

          {/* Select */}
          <div className="grid gap-3">
            <p className="text-sm font-medium">Select</p>
            <div className="max-w-sm">
              <Select label="Idioma de transcripción" hint="Más idiomas vendrán después.">
                <option value="es">Español</option>
                <option value="en">English</option>
              </Select>
            </div>
          </div>

          {/* Modal */}
          <div className="grid gap-3">
            <p className="text-sm font-medium">Modal</p>
            <div className="flex gap-3">
              <Button onClick={() => setOpen(true)}>Abrir modal</Button>
              <Button
                variant="ghost"
                onClick={() =>
                  push({
                    title: "Guardado",
                    message: "Tu configuración se guardó correctamente.",
                    variant: "success",
                  })
                }
              >
                Toast éxito
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Tip: navega con Tab y mira el foco visible (accesibilidad).
          </p>
          <Badge variant="default">v0</Badge>
        </CardFooter>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Ejemplo de modal"
        description="Este modal usa <dialog> y se puede cerrar con Escape o click fuera."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                push({ title: "Confirmado", message: "Acción confirmada.", variant: "success" });
              }}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Aquí pondremos formularios, confirmaciones o cualquier UI de flujo.
        </p>
      </Modal>
    </div>
  );
}
