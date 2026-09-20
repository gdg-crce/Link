# GDG Branded Link Manager (`link.gdgcrce.com`)

Production-ready, lightweight branded short-link management system built for **Google Developer Groups (GDG) On Campus — Fr. Conceicao Rodrigues College of Engineering (CRCE)**.

The system provides fast, memorable branded short URLs (such as `link.gdgcrce.com/submission`, `link.gdgcrce.com/register`), high-resolution QR codes, privacy-respecting analytics, and a private admin dashboard.

---

## Features

- ⚡ **Ultra-Fast Dynamic Redirects**: Server-side redirect engine querying PostgreSQL directly with minimal latency.
- 🔒 **Private Admin Dashboard**: Protected server-side via Supabase SSR authentication and Next.js middleware.
- 🎨 **GDG Design System**: Minimal, responsive, accessible interface with Google color accents and dark slate mode.
- 📱 **Branded QR Code Generator**: Generates high-resolution PNG & vector SVG QR codes pointing to the branded short URL.
- 📊 **Click Analytics**: Atomic click counter and privacy-conscious analytics (IP hashing, device type, top referrers, country detection).
- 🛡️ **Hardened Security**: Row Level Security (RLS) policies, slug regex validation, reserved path collision prevention, and open-redirect protection.
- 🚀 **Vercel & Custom Domain Ready**: Native Next.js 15 App Router architecture with full support for `link.gdgcrce.com`.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with RLS & Supabase SSR)
- **QR Codes**: `qrcode`
- **Icons**: `lucide-react`
- **Styling**: Vanilla CSS with modern GDG design tokens

---

## Architecture & URL Structure

```text
gdgcrce.com
      │
      └── link.gdgcrce.com
                    │
                    ▼
                  Vercel
                    │
      ┌─────────────┴─────────────┐
      │                           │
  Public Redirect            Private Admin
   /[slug]                     /admin
      │                           │
  Database Lookup             Auth & CRUD
      │                           │
  Click Log (Async)           QR Codes & Stats
      │                           │
  307/302 Redirect                │
      ▼                           ▼
Destination URL               Supabase DB
(Forms, Discord, RSVP)
```

### Public Routes:
- `/` — GDG On Campus CRCE branded landing page
- `/[slug]` — High-speed dynamic redirect to destination
- 404 handler — Branded custom 404 for missing or removed links

### Admin Routes:
- `/admin` — Overview dashboard with metrics & link directory
- `/admin/login` — Administrator authentication
- `/admin/links/new` — Create short link with slug check & preview
- `/admin/links/[id]/edit` — Edit link destination, title, expiry, and status
- `/admin/links/[id]/qr` — Generate and download branded QR codes (PNG/SVG)
- `/admin/links/[id]/analytics` — 7-day activity charts, device breakdown, top referrers

---

## Local Development

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v20+)
- npm or yarn

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:
```env
# Supabase Project Credentials (from Supabase Dashboard > Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Supabase Service Role Key (Keep strictly server-side, never expose to client!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Canonical App URL (Used for QR codes and link sharing)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Locally
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) for the public landing page and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin portal.

### 5. Run Tests & Build
```bash
# Run unit tests
npm test

# Production build verification
npm run build
```

---

## Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to [database.new](https://database.new) and create a new project (e.g. `gdg-crce-link`).
2. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from **Project Settings > API**.

### 2. Run Database Migrations
1. In your Supabase dashboard, open the **SQL Editor**.
2. Open the file [`supabase/migrations/20260920000000_init_link_manager.sql`](file:///c:/Users/varad/Documents/GDG/gdg%20link%20shortner/supabase/migrations/20260920000000_init_link_manager.sql) in this repository.
3. Paste the contents into the SQL Editor and click **Run**.
4. This script automatically creates:
   - `public.links` table with slug index
   - `public.link_clicks` table with timestamp and foreign key indexes
   - Row Level Security (RLS) policies
   - `record_link_click` atomic stored procedure

### 3. (Optional) Run Development Seed Data
To populate demo links for local testing:
1. In the Supabase **SQL Editor**, run the contents of [`supabase/seed.sql`](file:///c:/Users/varad/Documents/GDG/gdg%20link%20shortner/supabase/seed.sql).

---

## Creating the First Admin Account

1. In the Supabase Dashboard, navigate to **Authentication > Users**.
2. Click **Add User** -> **Create User**.
3. Enter the administrator email (e.g., `admin@gdgcrce.com`) and a secure password.
4. Toggle **Auto Confirm User?** to `ON` (or confirm via verification email).
5. You can now log in at `/admin/login` using these credentials.

---

## Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete GDG Branded Link Manager"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import your `gdg-crce/Link` repository.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` set to `https://link.gdgcrce.com`
5. Click **Deploy**.

---

## Connecting Custom Domain (`link.gdgcrce.com`)

The production public domain for GDG On Campus CRCE links is `https://link.gdgcrce.com`.

### 1. Add Domain in Vercel
1. In your Vercel Project Dashboard, navigate to **Settings > Domains**.
2. Enter `link.gdgcrce.com` and click **Add**.

### 2. Configure DNS Records
Vercel will specify the exact DNS record needed. In your domain registrar / DNS provider for `gdgcrce.com`:

| Type  | Name / Host | Target / Value          | TTL       |
|-------|-------------|-------------------------|-----------|
| CNAME | `link`      | `cname.vercel-dns.com.` | Automatic |

*(Note: Verify the exact target provided in the Vercel dashboard during configuration).*

Once DNS propagates (usually 1-15 minutes), Vercel will automatically provision a free SSL certificate, making `https://link.gdgcrce.com` live and secure.

---

## Usage Workflow

```text
Admin logs in at /admin
       ↓
Click "+ Create Link"
       ↓
Choose Slug: "submission"
Destination: "https://forms.google.com/..."
Title: "BitNBuild 2026 Submission Form"
       ↓
Click "Create Link"
       ↓
Share branded URL: https://link.gdgcrce.com/submission
or download and print high-resolution QR code
```

---

## License

Maintained with ❤️ by the **Google Developer Groups On Campus CRCE** team.
