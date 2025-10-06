# Dispatch Admin Dashboard

Production-ready admin dashboard for the Dispatch community safety application.

---

## Setup

### Step 1: Install Dependencies

```bash
cd admin-dashboard
bun install
```

### Step 2: Configure Environment

**Option A: If you have Dispatch mobile app set up**

Copy credentials from `dispatch/.env` to `admin-dashboard/.env.local` with `NEXT_PUBLIC_` prefix:

```env
# Example: If dispatch/.env has:
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Create admin-dashboard/.env.local with:
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Option B: Starting fresh**

1. Get credentials from [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API
2. Create `.env.local` file:
   ```bash
   cp env.example .env.local
   ```
3. Edit `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 3: Run Database Migration

1. Open [Supabase SQL Editor](https://supabase.com/dashboard)
2. Click **"New Query"**
3. Copy SQL from: `supabase-migrations/admin-setup.sql`
4. Paste and **Run**

✅ Success message: "Success. No rows returned"

### Step 4: Create Admin User

1. Get your user ID from Supabase Dashboard:
   - Navigate to: **Authentication** → **Users** → Copy your user ID

2. Run in SQL Editor:
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE id = 'your-user-id-here';
   ```

✅ Success message: "Success. 1 row updated"

### Step 5: Start Dashboard

```bash
bun run dev
```

🎉 Open [http://localhost:3000](http://localhost:3000)

---

## Commands

```bash
bun run dev      # Start dev server
bun run build    # Build for production
bun run start    # Start production server
bun run lint     # Run linter
```

---

## Troubleshooting

**Cannot connect to Supabase?**
- Check `.env.local` has `NEXT_PUBLIC_` prefix
- Restart: `bun run dev`

**Access denied?**
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = 'your-user-id';
```

**Port 3000 in use?**
```bash
bun run dev -- -p 3001
```

---

**Tech Stack:** Next.js 15 • React 19 • TypeScript • Tailwind CSS • Supabase • Bun
