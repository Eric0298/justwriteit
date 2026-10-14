# JustWriteIt — Project Context

> Documento compartido por Codex y Claude Code. Describir únicamente hechos comprobados; no convertir hipótesis en decisiones de arquitectura.
> Las reglas globales de seguridad, Git, permisos y uso de MCP se mantienen en las instrucciones globales de cada agente.

## 1. Producto y alcance actual

- **Nombre:** JustWriteIt.
- **Propósito:** aplicación web gratuita de portfolio para transcribir archivos de audio y grabaciones en directo con IA; ofrece historial privado, exportación TXT/SRT/VTT y modo de estudio basado en segmentos.
- **Idiomas admitidos en validadores:** español, inglés, catalán y francés.
- **Límites definidos en código:** 10 transcripciones diarias, máximo 10 MB por audio y 3 minutos de duración.
- **Situación comercial actual:** sin suscripciones, facturación ni planes de pago. No introducir funcionalidades comerciales por inferencia.
- **Objetivo actual / roadmap:** PENDIENTE de confirmar con el propietario.

## 2. Stack y requisitos

Versiones resueltas en `package-lock.json` en la fecha de análisis; verificar de nuevo si cambia el lockfile:

- Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5.9.3.
- Tailwind CSS 4.1.18, Zod 4.3.6.
- Auth.js / NextAuth 5.0.0-beta.30, `pg` 8.17.2, Vercel Blob 2.2.0 y Resend 6.9.2.
- npm con `package-lock.json` v3; no hay versión de npm fijada en el repositorio.
- README: Node 20+; la versión de Next.js resuelta requiere Node >=20.9.0.
- PostgreSQL 15+ está documentado, pero no hay un entorno PostgreSQL reproducible versionado.

## 3. Arquitectura y responsabilidades

- **Modelo general:** monolito full-stack Next.js App Router, con servicio externo de transcripción Whisper vía HTTP.
- `src/app`: rutas, layouts, Server Actions y Route Handlers `api/*`.
- `src/components`: interfaz de landing, dashboard, historial, transcripción y componentes compartidos.
- `src/hooks`: hooks reutilizables.
- `src/lib`: consultas, seguridad, validaciones, límites e integraciones.
- `src/db`: esquema SQL y migraciones.
- `src/types`: ampliaciones de tipos.
- `public`: imágenes, iconos y recursos visuales.
- `scripts`: diagnósticos de configuración.
- Los Server Components son la opción por defecto; usar `"use client"` solo para interactividad requerida.
- El backend usa runtime Node.js mediante Route Handlers y Server Actions.
- PostgreSQL se consulta con `pg` y SQL parametrizado, sin ORM; la lógica de consultas está principalmente en `src/lib/queries`.
- La autenticación y autorización combinan Auth.js/JWT y comprobaciones de sesión y propiedad (`user_id`).
- El proceso de transcripción usa Vercel Blob para uploads, Whisper externo y persistencia en PostgreSQL; Resend es opcional.
- La grabación en vivo almacena temporalmente fragmentos en PostgreSQL (`bytea`) y los elimina después de completar el proceso.

## 4. Convenciones observadas

- TypeScript estricto y alias `@/*` → `src/*`.
- Predominan comillas dobles, punto y coma y sangría de dos espacios.
- Componentes React en `PascalCase`, hooks con prefijo `use`, utilidades en `camelCase`, endpoints `route.ts`.
- Identificadores técnicos en inglés; textos de interfaz y muchos mensajes en español.
- Validaciones de payload en `src/lib/validators`; acceso SQL separado por entidad.
- Estilos mediante tokens CSS, clases semánticas y utilidades Tailwind CSS 4.
- No hay configuración de Prettier ni Biome. No convertir excepciones de nombres actuales en convenciones.

## 5. Comandos existentes

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
npm run check:setup
```

- Inicialización documentada para una base nueva: `psql "$DATABASE_URL" -f src/db/schema.sql` (**modifica base de datos; requiere autorización expresa**).
- Servicio Whisper local: `docker compose up --build whisper` (**arranca recursos y depende de `../../whisper-service`; requiere confirmación previa**).
- `npm run check:setup` consulta variables de entorno, PostgreSQL y la salud de Whisper; **no** tratarlo como test aislado ni ejecutarlo automáticamente.

## 6. Pruebas y comprobaciones

- **Tests automatizados:** no configurados (sin script `test`, framework de tests ni cobertura).
- **CI versionada:** no identificada en el informe.
- Para cambios de código, ejecutar `npm run lint` y, cuando sea apropiado, `npm run build` e informar resultados reales.
- No afirmar que existe cobertura funcional automatizada hasta introducirla y comprobarla.
- Proponer pruebas manuales ajustadas al flujo modificado y mantener sin cambios la infraestructura salvo autorización.

## 7. Seguridad y límites de actuación propios del proyecto

- Preservar validaciones Zod, SQL parametrizado, comprobaciones de sesión y propiedad, límites diarios, rate limiting y controles de archivos de audio.
- Mantener la verificación de host permitido, HTTPS en producción y firma/tipo real de archivos remotos.
- No debilitar CSP, cabeceras de seguridad ni protecciones de endpoints para resolver problemas superficiales.
- No imprimir secretos ni contenido privado de audios o transcripciones.
- Antes de modificar esquema, migraciones, almacenamiento de audio, autenticación o límites de consumo, explicar compatibilidad, seguridad y efecto sobre datos existentes y solicitar aprobación.

## 8. Despliegue e integraciones externas

- **Hecho confirmado:** el código integra Vercel Blob y contempla el dominio `justwriteit.app` y una URL alternativa `vercel.app`.
- **No confirmado:** proveedor y proyecto activos, ramas de despliegue, entornos Preview/Production, alojamiento de PostgreSQL y Whisper, límites efectivos de ejecución y procedimientos de rollback.
- No asumir que el despliegue activo es Vercel hasta comprobarlo en las conexiones o documentación pertinente y con permiso para inspección.

## 9. Documentos y puntos de atención

Fuentes prioritarias a revisar según la tarea: `README.md`, `package.json`, `package-lock.json`, `next.config.ts`, `src/db/schema.sql`, `src/db/migrations/`, `src/lib/usage/limits.ts`, `src/lib/validators/transcribe.ts`.

Desajustes observados en la auditoría (no corregir sin tarea específica):

- La ruta de `middleware.ts` indicada en README difiere de su ubicación real en la raíz.
- Una migración conserva un comentario antiguo de 50 MB frente al límite actual de 10 MB.
- La firma personalizada requiere `NEXTAUTH_SECRET`; no asumir que `AUTH_SECRET` lo sustituye.
- `APP_BASE_URL` se utiliza, pero no figura en `.env.example`.
- Las precedencias de URLs no están centralizadas.
- El procedimiento de migración para bases de datos preexistentes necesita confirmación.

## 10. Trabajo actual y continuidad

- **Objetivo actual:** PENDIENTE de confirmar.
- **Tarea activa:** PENDIENTE de confirmar.
- **Último estado funcional verificado:** PENDIENTE de confirmar.
- **Próximo paso acordado:** PENDIENTE de confirmar.

Actualizar esta sección solamente a partir de información confirmada durante las sesiones. No inventar progreso ni considerar ejecutados tests, despliegues o migraciones que no se hayan realizado.
