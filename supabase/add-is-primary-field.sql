-- =============================================
-- Añadir campo is_primary a pet_photos
-- =============================================

ALTER TABLE pet_photos ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Asegurarse de que solo haya una foto primaria por mascota
CREATE UNIQUE INDEX IF NOT EXISTS pet_photos_primary_unique
  ON pet_photos (pet_id)
  WHERE is_primary = true;

COMMENT ON COLUMN pet_photos.is_primary IS 'Indica si esta es la foto principal de la mascota';
