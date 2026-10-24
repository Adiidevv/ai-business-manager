# AI Business Manager — Account Security Upgrade

This bundle contains complete replacement files for the `aws-upgrade` branch.

## Included
- Email/password registration and login
- Password hashing using Node.js `crypto.scrypt` (no extra npm dependency)
- Signed, HttpOnly session cookie
- Server-side ownership checks on business and transaction routes
- Additive PostgreSQL migration for `users` and `business.user_id`
- Existing dashboard retained with a sign-out button

## Before starting
1. Make sure you are on `aws-upgrade`, not `main`.
2. Keep a copy of your current files / commit your staged work first.
3. In `.env.local`, preserve the existing `DATABASE_URL` and add a strong `AUTH_SECRET`.
   Generate one in Terminal with:
   `printf '\nAUTH_SECRET=%s\n' "$(openssl rand -hex 32)" >> .env.local`
   Run this only once. Do not share or commit `.env.local`.
4. Stop the local server with Ctrl+C if it is running.

## Install
Copy the files from this bundle over the matching project files:
- `server.js`
- `database.js`
- `public/index.html`
- `public/app.js`
- `public/style.css`

Do not replace `.env.local`. `package.json` and `.gitignore` are included for reference and do not require changes for this implementation.

## Test
Run:
`npm start`

Expected startup messages include:
- `Database tables are ready.`
- `Server is running on port 3000`

Open `http://localhost:3000`.
1. Create an account using an email you control and a password of at least 10 characters.
2. Set up your business and add a test transaction.
3. Sign out, then sign in again and confirm the business remains available.
4. Try signing in with an incorrect password; it should be rejected.
5. Confirm dashboard totals, transactions, chart, and advice still load.

## Important data/security notes
- The database migration preserves existing businesses and transactions, but existing businesses are left unassigned (`user_id` is NULL). They are intentionally not automatically attached to the first account. Create a new business under your account for testing; don't delete legacy records.
- All business APIs require a signed-in session and verify ownership.
- Production deployment requires `AUTH_SECRET` to be set as an environment variable. Do not deploy this bundle to Render yet; test locally first.
- The session cookie is HttpOnly and SameSite=Lax. This first account-security milestone is a foundation, not a full production security audit; add rate limiting, email verification, password reset, logging/monitoring, and CSRF hardening before public launch.


## Integrated operations upgrade
This version adds separate Supplier Payments, Inventory, Cash-flow Intelligence and AI Assistant workspaces to the existing Overview and Customer Tracking navigation. Database tables are created additively at startup; existing records are not intentionally dropped.

### Install
1. Stop the app with Ctrl+C.
2. Back up your database and current project files.
3. Copy the ZIP contents over your project, allowing the updated files to replace existing files. Keep your `.env.local` unchanged; it is intentionally not included.
4. Install dependencies if needed with `npm install`.
5. Start using `npm start` and hard-refresh the browser (Cmd+Shift+R).
6. In each workspace, add test data first and verify calculations before using it for real decisions.

### AI
Rule-based answers work without an API key. For provider-backed responses, set `GEMINI_API_KEY` in `.env.local` or the deployment environment and restart the server. Never put API keys in frontend files. Check current provider pricing, free-tier quota and data policies first.

### Smoke tests
With the server running, execute `npm run security:smoke`. It checks that several endpoints reject unauthenticated requests; it does not replace two-user data-isolation testing or a security audit. See `SECURITY_AND_DEPLOYMENT.md`.
