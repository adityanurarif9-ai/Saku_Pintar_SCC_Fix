# SakuPintar production updates

- The owner requested maintenance while production updates are in progress. Before a production deployment or database change, enable maintenance using the existing admin control or the project owner's authenticated Supabase SQL Editor. Read `PANDUAN-SUPABASE.md` for the exact status update queries.
- Keep the maintenance window brief. Verify the published application and required database changes, then turn maintenance off. Report any blocker that prevents restoring service; do not leave maintenance enabled after a successful update.
- Do not activate production maintenance for local development, mock UI tests, or read-only checks. If this feature has not yet been installed, implement and test it locally first.
- Frontend code must not create admin privileges or contain service-role credentials. Backend functions and RLS determine admin access and data ownership.
- Email confirmation/reset destinations must use the canonical production app URL. Local redirects require explicit dev-only opt in; do not change Supabase's production Site URL to localhost.
