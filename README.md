# JustWriteIt

Aplicación web open source para transcribir audio a texto con IA. Sube un archivo o graba en vivo, elige idioma, y obtén la transcripción con historial privado por usuario.

Es un proyecto de portfolio: gratis para todos, sin planes ni pagos. Cada cuenta tiene un tope diario para no reventar el backend Whisper.

## Stack

- Next.js 16 App Router + React 19 + TypeScript
- NextAuth (credentials + JWT)
- PostgreSQL (`pg`)
- Tailwind CSS 4
- Vercel Blob para subida de audio
- `whisper-service` (FastAPI + `faster-whisper`) para la transcripción

## Límites de uso

Cada usuario tiene:

- 10 transcripciones al día.
- Archivos de audio de hasta 50 MB.
- Sesiones de grabación en vivo de hasta 30 minutos.

Configurables en [src/lib/usage/limits.ts](src/lib/usage/limits.ts).

## Setup local

Requisitos: Node 20+ y PostgreSQL 15+ corriendo en local.

```bash
git clone https://github.com/<tu-usuario>/justwriteit.git
cd justwriteit
npm install
cp .env.example .env.local
# edita .env.local con tus valores
```

Aplica el esquema de base de datos:

```bash
psql "$DATABASE_URL" -f src/db/schema.sql
```

Levanta el servicio Whisper (en otro terminal). El repo con el servicio:

```
https://github.com/<tu-usuario>/whisper-service
```

O directamente con Docker Compose desde este repo:

```bash
docker compose up --build whisper
```

Arranca la app:

```bash
npm run dev
```

Abre <http://localhost:3000>.

Verifica que todo está bien conectado:

```bash
npm run check:setup
```

## Variables de entorno

Mínimas para arrancar:

- `DATABASE_URL` — Postgres.
- `NEXTAUTH_SECRET` (y `AUTH_SECRET`) — secreto para firmar JWTs.
- `NEXTAUTH_URL` (y `AUTH_URL`, `APP_URL`) — URL pública de la app.
- `WHISPER_SERVICE_URL` — endpoint del servicio Whisper.
- `WHISPER_SERVICE_TOKEN` — si el servicio Whisper requiere Bearer.
- `BLOB_READ_WRITE_TOKEN` — token de Vercel Blob (para subida de archivos).

Opcionales:

- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — notificaciones por email al terminar transcripciones.
- `ALLOWED_AUDIO_SOURCE_HOSTS` — allowlist de hosts para URLs remotas de audio.

Consulta [.env.example](.env.example).

## Scripts

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run start        # arranca el build
npm run lint         # eslint
npm run check:setup  # verifica env vars + DB + Whisper
```

## Estructura relevante

```
src/
├── app/
│   ├── api/                # endpoints (upload, transcribe, usage, auth)
│   └── dashboard/          # UI autenticada
├── components/
│   ├── transcribe/         # UI de transcripción de archivos
│   ├── transcribe-live/    # UI de transcripción en vivo
│   └── usage/              # aviso de límite diario
├── db/
│   ├── schema.sql          # esquema completo
│   └── migrations/         # migraciones incrementales
├── lib/
│   ├── queries/            # acceso a DB
│   ├── usage/              # límites diarios
│   └── transcription/      # cliente del servicio Whisper
└── middleware.ts           # auth guard para rutas privadas
```

## Contribuir

PRs bienvenidas. Abre un issue primero si vas a tocar arquitectura o base de datos.

## Licencia

[MIT](LICENSE) © Eric Mancebo
