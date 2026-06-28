# JustWriteIt

JustWriteIt es una aplicacion web para transcribir audios a texto con IA, gestionar historial privado por usuario y trabajar con transcripciones de archivo o grabacion en vivo.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- NextAuth credentials/JWT
- PostgreSQL con `pg`
- Tailwind CSS
- Vercel Blob para subida de audio
- `whisper-service` FastAPI + `faster-whisper`

## Desarrollo

```bash
npm install
npm run dev
```

La app queda en `http://localhost:3000`.

## Base de datos

Aplica el esquema base o las migraciones de `src/db/migrations`.

La migracion freemium principal es:

```text
src/db/migrations/004_freemium_billing_security.sql
```

## Whisper

Repositorio relacionado:

```text
C:\Users\Usuario\Documents\proyectos\whisper-service
```

Con Docker desde este repo:

```bash
docker compose up --build whisper
```

O desde `whisper-service`:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

JustWriteIt llama a `WHISPER_SERVICE_URL` desde backend. Si `WHISPER_SERVICE_TOKEN` esta definido, se envia como `Authorization: Bearer`.

## Variables

Copia `.env.example` a `.env.local` y completa valores reales fuera de Git.

Variables principales:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `WHISPER_SERVICE_URL`
- `WHISPER_SERVICE_TOKEN`
- `BLOB_READ_WRITE_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_PREMIUM`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Freemium

Los planes estan definidos en `src/lib/billing/plans.ts`.

- Free: 3 transcripciones al dia.
- Pro: 50 transcripciones al dia.
- Premium: 200 transcripciones al dia.

La validacion real ocurre en API y Postgres, no en localStorage ni solo en UI.

## Pagos

La pantalla `/dashboard/billing` crea sesiones de Stripe Checkout desde backend. El plan del usuario se actualiza solo al recibir un webhook valido en:

```text
/api/stripe/webhook
```

Consulta `PAYMENTS_SETUP.md`.

## Seguridad y limites

Consulta:

- `SECURITY_CHECKLIST.md`
- `USAGE_LIMITS.md`

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Autor

Eric Mancebo Muminhodzic

