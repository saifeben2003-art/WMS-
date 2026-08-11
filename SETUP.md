# CL WMS — Setup Guide

## 1. Create a PostgreSQL Database

Choose one of these providers (all have free tiers):

### Option A: Vercel Postgres (easiest if deploying on Vercel)
1. Go to your Vercel project → **Storage** → **Create Database** → **Postgres**
2. Select region closest to your users
3. Vercel automatically sets `DATABASE_URL` in Environment Variables

### Option B: Neon (serverless PostgreSQL)
1. Go to [neon.tech](https://neon.tech) → Create Project
2. Copy the connection string (looks like `postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require`)

### Option C: Supabase
1. Go to [supabase.com](https://supabase.com) → New Project
2. Go to **Settings** → **Database** → Copy the **Connection string** (URI tab)
3. Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

---

## 2. Set Environment Variables

On Vercel:
1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - `DATABASE_URL` = your PostgreSQL connection string from Step 1
   - `TOKEN_SECRET` = a random string (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = your Vercel URL (e.g. `https://my-wms.vercel.app`)

Locally:
1. Copy `.env.example` to `.env`
2. Fill in the values

---

## 3. Run Database Migrations

**On Vercel:** Vercel runs `prisma migrate deploy` automatically via the `postinstall` script in `package.json`.

**Locally:**
```bash
# Generate migration from schema changes
npx prisma migrate dev --name init

# Or push schema directly (dev only, no migration file)
npx prisma db push

# Regenerate Prisma Client
npx prisma generate
```

---

## 4. Seed Demo Data (Local Development Only)

The seed endpoint is **disabled in production**. Locally:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H 'Content-Type: application/json' \
  -d '{"force": true}'
```

Default admin account: `admin@combilift.com` / `Admin@2024`

---



```bash
```


---

## Notes

- **SQLite is no longer supported.** The project now requires PostgreSQL for Vercel serverless compatibility.
- **Never commit `.env`** to Git. Use `.env.example` as template.
- The seed endpoint (`POST /api/seed`) returns `403` when `NODE_ENV=production`.