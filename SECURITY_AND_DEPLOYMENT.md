# Security, backup and deployment checklist

## Before testing with real users
- Keep `.env`, `.env.local`, API keys, database dumps and real customer data out of Git and ZIPs.
- Set a long random `AUTH_SECRET` in every deployment. Production startup refuses to run without it.
- Use HTTPS in production. The session cookie is marked Secure when `NODE_ENV=production`.
- Test with two separate accounts: create a business under account A and verify account B cannot access its business ID, transactions, customer balances, supplier bills or inventory.
- Review every new endpoint before public launch; automated syntax checks are not a full security audit.
- Use least-privilege PostgreSQL credentials, restrict database network access, update Node dependencies and monitor logs without logging secrets.
- Add rate limiting, email verification, password reset, CSRF review, audit logs and a formal privacy/retention policy before commercial launch.
- Supplier payments and inventory are independent operational records. Inventory changes do not automatically create sales or expense transactions. Record those in the transaction workspace separately to avoid accidental accounting duplication.

## Optional AI
Set `GEMINI_API_KEY` as a server environment variable to enable provider-backed answers. Do not expose this key in browser code or commit it. Provider free tiers and availability can change; verify current terms, quotas, data handling and regional availability before using it with customer information. Without a key, the app returns a rule-based fallback. AI output can be wrong; users should verify financial decisions.

## Backup and restore (local PostgreSQL)
Back up before upgrades. From Terminal, use the same PostgreSQL connection that the app uses:
```sh
pg_dump "$DATABASE_URL" --format=custom --file "$HOME/Desktop/ai-business-manager-backup.dump"
```
Restore into a **separate empty test database first**:
```sh
createdb ai_business_manager_restore_test
pg_restore --dbname "postgresql://localhost:5432/ai_business_manager_restore_test" "$HOME/Desktop/ai-business-manager-backup.dump"
```
Keep backups encrypted and private. Test restores regularly. Never upload a real database dump into support chats.

## Deployment cost review
- Local development can run without a paid hosting service if Node.js and PostgreSQL are installed locally.
- Public deployment typically needs an always-available application host, persistent PostgreSQL, backups, a domain/HTTPS and possibly an AI provider quota. Free tiers, sleeping behavior, storage limits and pricing change; check providers' current terms before launch.
- Estimate expected monthly costs and set usage alerts/limits before onboarding paying customers.
