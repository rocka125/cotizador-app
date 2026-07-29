-- price_list_versions (2 rows). Uses deterministic UUIDs derived from
-- the old integer id, so this file is safe to identify/cross-reference even
-- though it was regenerated to fix the SQL Editor size-limit error on the
-- original single 0014 file.
insert into public.price_list_versions (id, nombre, descripcion, activa, total_skus, created_at) values
  ('cb3beaf6-4462-5a0b-8cb6-3a638a7631b1'::uuid, '2026Q2 Main Price list AMER FINAL EFF 050426', NULL, true, 10261, '2026-07-22 22:20:14'),
  ('8659a539-852d-5201-a29f-8e41b0b981b8'::uuid, '2025Q4 Mid Price list AMER FINAL EFF 120825 (4)', NULL, false, 10794, '2026-07-22 22:31:40');
