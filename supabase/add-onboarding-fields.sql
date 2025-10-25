-- =============================================
-- Añadir campos para el onboarding
-- =============================================

-- Añadir campos a la tabla pets
ALTER TABLE pets ADD COLUMN IF NOT EXISTS user_intent TEXT
  CHECK (user_intent IN ('breeding', 'playdates', 'open'));

ALTER TABLE pets ADD COLUMN IF NOT EXISTS personality_tags TEXT[];

-- Los demás campos ya existen:
-- name, breed, gender, age, has_pedigree, is_neutered, ready_to_breed, has_bred_before

COMMENT ON COLUMN pets.user_intent IS 'Intención del usuario: breeding (cruza), playdates (juegos), open (abierto a todo)';
COMMENT ON COLUMN pets.personality_tags IS 'Array de etiquetas de personalidad (ej: juguetón, tranquilo, etc.)';
