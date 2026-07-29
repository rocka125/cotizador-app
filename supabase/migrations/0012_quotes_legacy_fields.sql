-- Adds columns discovered by inspecting the real production data dump
-- (cotizador (9).sql) that weren't in the original 0004 design:
-- separate cliente_nombre/telefono/email fields (distinct from the
-- atencion/puesto/empresa contact fields), and legacy signature/seal
-- file PATHS from the old PHP server's uploads/firmas/ folder -- the
-- actual image bytes aren't in the SQL dump, only the paths, so these
-- are kept as a reference in case the files are recovered later. New
-- quotes created going forward keep using firma_img/sello_img (base64).

alter table public.quotes
  add column cliente_nombre text,
  add column cliente_telefono text,
  add column cliente_email text,
  add column firma_path_legacy text,
  add column sello_path_legacy text;
