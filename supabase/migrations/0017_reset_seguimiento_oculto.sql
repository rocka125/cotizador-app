-- One-time data fix: every quote imported by 0013_import_legacy_data.sql
-- ended up with seguimiento_oculto = true in the actual database (an early,
-- buggy version of the import script set it uniformly true; the file on
-- disk was later corrected per-row, but since 0013 is a one-time,
-- non-idempotent import it was never re-run against the live DB).
--
-- seguimiento_oculto is meant to be a manual "hide this quote from the
-- Seguimiento board" toggle (see toggleOcultar in
-- src/app/(app)/seguimiento/actions.ts) -- there's no legitimate reason for
-- every quote to start out hidden. With everything hidden, the board's
-- default "activas" filter (seguimiento_oculto = false) always returned
-- zero rows, which is why sending a quote by email (or that email being
-- opened -- record_email_open() itself works fine) never appeared to show
-- up anywhere: the whole board was empty regardless.

update public.quotes set seguimiento_oculto = false where seguimiento_oculto = true;
