# MonthMap Budgeting

MonthMap is a lightweight budgeting app with:

- Supabase Auth for email/password sign up and login
- Supabase Postgres for per-user monthly budgets and entries
- OpenAI-powered spending analysis through the local Node server

## Current App Shape

- Frontend entry point: [index.html](/c:/Users/emman/OneDrive/Escritorio/budgetting/index.html)
- Frontend logic: [script.js](/c:/Users/emman/OneDrive/Escritorio/budgetting/script.js)
- Styles: [styles.css](/c:/Users/emman/OneDrive/Escritorio/budgetting/styles.css)
- Backend entry point: [server.js](/c:/Users/emman/OneDrive/Escritorio/budgetting/server.js)
- Supabase schema + RLS: [supabase/schema.sql](/c:/Users/emman/OneDrive/Escritorio/budgetting/supabase/schema.sql)

## What Changed

- Replaced local budget persistence with Supabase-backed per-user storage.
- Added email/password sign up, login, logout, and persistent sessions.
- Added public config delivery from the Node server via `/api/config`.
- Kept OpenAI analysis on the server so your API key stays server-side.
- Preserved the existing UI and budgeting flow as much as possible.

## Replit Secrets / `.env`

Add these values in Replit Secrets or your local `.env`:

- `SUPABASE_URL`
  Public project URL, for example `https://your-project-ref.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`
  Supabase public publishable key
- `OPENAI_API_KEY`
  Your server-side OpenAI API key
- `OPENAI_MODEL`
  Optional. Defaults to `gpt-5`
- `PORT`
  Optional. Defaults to `3000`

Only the public Supabase URL and anon key are exposed to the browser through `/api/config`.
Do not put the Supabase service role key in client code.

## Supabase Dashboard Steps

1. Create a Supabase project.
2. In Supabase Auth:
   Enable Email auth.
3. In the SQL Editor:
   Run [supabase/schema.sql](/c:/Users/emman/OneDrive/Escritorio/budgetting/supabase/schema.sql)
4. In Project Settings > API:
   Copy `Project URL` into `SUPABASE_URL`
   Copy your publishable key into `SUPABASE_PUBLISHABLE_KEY`
5. In Replit:
   Add the required secrets and redeploy/restart

## Database Tables

- `profiles`
- `monthly_budgets`
- `income_entries`
- `expense_entries`
- `savings_entries`

The schema also enables Row Level Security so each user can only read and write their own rows.

## Run Locally

1. Copy `.env.example` to `.env`
2. Fill in the Supabase and OpenAI values
3. Start the app:

```powershell
npm start
```

4. Open `http://localhost:3000`

## Data Flow

After login:

1. The frontend loads `/api/config`
2. The browser creates a Supabase client with the public anon key
3. The authenticated user session is restored automatically
4. The app loads the selected month from:
   - `monthly_budgets`
   - `income_entries`
   - `expense_entries`
   - `savings_entries`
5. Add/edit/remove actions write back to Supabase for the logged-in user only

## Notes

- The app now stores the selected month locally for convenience, but budgeting data itself is user-scoped in Supabase.
- If you open the HTML file directly instead of running the local server, auth and AI analysis will not work correctly.
