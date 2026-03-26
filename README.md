# Legacy Land & Cattle — Customer Portal

Grass-fed beef ordering portal for Legacy Land & Cattle customers.

**Stack:** Next.js 15 · Supabase · Resend · Tailwind CSS

---

## Block 1 Status: ✅ Complete

### Completed
- ✅ GitHub repo: `goldycodes87/legacy-beef-portal`
- ✅ Supabase schema: 6 tables with RLS enabled
- ✅ Homepage (`/`)
- ✅ Slot booking page (`/book`)
- ✅ Session landing page (`/session/[uuid]`)
- ✅ Cut sheet placeholder (`/session/[uuid]/cuts`)
- ✅ API: `GET /api/slots` — returns available butcher slots
- ✅ API: `POST /api/book` — creates customer + session + sends email
- ✅ Magic link auth via Supabase Auth
- ✅ Branded Resend email template
- ✅ Test data: "Test Steer #1" half_a slot available

---

## Vercel Deployment (Grant needs to do this)

### Step 1: Get a Resend API Key
1. Go to [resend.com](https://resend.com) → sign up / log in
2. Create an API key
3. Verify your sending domain (`legacylandandcattleco.com`)

### Step 2: Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import from GitHub → select `goldycodes87/legacy-beef-portal`
3. **Team:** Select `goldycodes87` org (or personal account)
4. Add these **Environment Variables** in the Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://rmolayrkbkcmtoahsiqj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtb2xheXJrYmtjbXRvYWhzaXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTY1NDIsImV4cCI6MjA4OTUzMjU0Mn0.GEimTCxrXSEELiYoaKN6tlGqD7TZPpCZY2f2SuH_bVE
SUPABASE_SERVICE_ROLE_KEY=REDACTED_SERVICE_KEY
RESEND_API_KEY=re_YOUR_RESEND_KEY_HERE
NEXT_PUBLIC_APP_URL=https://legacylandandcattleco.com
```

5. Click **Deploy**

### Step 3: Add Custom Domain in Vercel
1. Go to your project → Settings → Domains
2. Add: `legacylandandcattleco.com`
3. Vercel will show you DNS records to add

### Step 4: DNS Records in GoDaddy

After adding the domain in Vercel, add these 2 DNS records to GoDaddy:

| Type  | Name | Value |
|-------|------|-------|
| A     | @    | 76.76.21.21 |
| CNAME | www  | cname.vercel-dns.com |

> Note: Vercel may give slightly different values — use whatever they show in their dashboard.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env.local

# Run dev server
npm run dev
```

---

## Supabase Tables

All tables are in the `public` schema with RLS enabled.

| Table | Description |
|-------|-------------|
| `customers` | Customer info |
| `animals` | Cattle inventory |
| `butcher_slots` | Bookable slots (whole/half_a/half_b) |
| `sessions` | Order sessions (shareable URLs) |
| `payments` | Payment records |
| `notifications` | Email/SMS log |

The service role key bypasses RLS — used in all server-side API routes.
