-- =============================================
-- ZOODATE DATABASE SCHEMA
-- Tinder para mascotas 🐾
-- =============================================

-- Enable PostGIS for geolocation queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- 1. PROFILES TABLE (Usuarios/Dueños)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326), -- Coordenadas GPS (lat, lng)
  location_text TEXT, -- "Madrid, España"
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para búsquedas geográficas rápidas
CREATE INDEX profiles_location_idx ON profiles USING GIST(location);

-- =============================================
-- 2. PETS TABLE (Mascotas)
-- =============================================
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'other')),
  breed TEXT,
  age INTEGER CHECK (age >= 0 AND age <= 30),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),

  -- NUEVOS CAMPOS
  has_pedigree BOOLEAN DEFAULT false, -- Si tiene pedigrí
  is_neutered BOOLEAN DEFAULT false, -- Si está castrado/esterilizado
  ready_to_breed BOOLEAN DEFAULT true, -- Si está disponible para cruza
  has_bred_before BOOLEAN DEFAULT false, -- Si ya ha sido cruzado anteriormente

  is_active BOOLEAN DEFAULT true, -- Si está activo para matching
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para búsquedas por usuario
CREATE INDEX pets_user_id_idx ON pets(user_id);
CREATE INDEX pets_species_idx ON pets(species);
CREATE INDEX pets_is_active_idx ON pets(is_active);

-- =============================================
-- 3. PET_PHOTOS TABLE (Hasta 3 fotos por mascota)
-- =============================================
CREATE TABLE pet_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL, -- URL en Supabase Storage
  photo_order INTEGER NOT NULL CHECK (photo_order >= 1 AND photo_order <= 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Solo 3 fotos por mascota
  UNIQUE(pet_id, photo_order)
);

-- Index para cargar fotos rápidamente
CREATE INDEX pet_photos_pet_id_idx ON pet_photos(pet_id);

-- =============================================
-- 4. LIKES TABLE (Swipes - like o dislike)
-- =============================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  to_pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL, -- true = like, false = dislike/pass
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Evitar likes duplicados
  UNIQUE(from_pet_id, to_pet_id),

  -- Evitar que una mascota se de like a si misma
  CHECK (from_pet_id != to_pet_id)
);

-- Indexes para detectar matches rápidamente
CREATE INDEX likes_from_pet_idx ON likes(from_pet_id);
CREATE INDEX likes_to_pet_idx ON likes(to_pet_id);
CREATE INDEX likes_mutual_idx ON likes(from_pet_id, to_pet_id, is_like);

-- =============================================
-- 5. MATCHES TABLE (Matches mutuos)
-- =============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_1_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  pet_2_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unmatched_at TIMESTAMP WITH TIME ZONE, -- Si alguien deshizo el match

  -- Evitar duplicados (pet1-pet2 y pet2-pet1 son el mismo match)
  CHECK (pet_1_id < pet_2_id),
  UNIQUE(pet_1_id, pet_2_id)
);

-- Indexes para búsquedas de matches
CREATE INDEX matches_pet_1_idx ON matches(pet_1_id) WHERE unmatched_at IS NULL;
CREATE INDEX matches_pet_2_idx ON matches(pet_2_id) WHERE unmatched_at IS NULL;

-- =============================================
-- 6. MESSAGES TABLE (Chat entre matches)
-- =============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes para cargar mensajes rápidamente
CREATE INDEX messages_match_id_idx ON messages(match_id, created_at DESC);
CREATE INDEX messages_unread_idx ON messages(match_id) WHERE read_at IS NULL;

-- =============================================
-- 7. SUBSCRIPTIONS TABLE (Suscripciones Premium)
-- =============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium', 'gold')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un usuario solo puede tener una suscripción activa
  UNIQUE(user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Index para verificar suscripciones activas rápidamente
CREATE INDEX subscriptions_user_active_idx ON subscriptions(user_id)
  WHERE status = 'active';

-- =============================================
-- FUNCIÓN: Crear match automáticamente cuando hay like mutuo
-- =============================================
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  mutual_like_exists BOOLEAN;
  smaller_pet_id UUID;
  larger_pet_id UUID;
BEGIN
  -- Solo crear match si es un like (no un dislike)
  IF NEW.is_like = true THEN
    -- Verificar si hay like mutuo
    SELECT EXISTS(
      SELECT 1 FROM likes
      WHERE from_pet_id = NEW.to_pet_id
        AND to_pet_id = NEW.from_pet_id
        AND is_like = true
    ) INTO mutual_like_exists;

    -- Si hay like mutuo, crear el match
    IF mutual_like_exists THEN
      -- Ordenar IDs para evitar duplicados
      IF NEW.from_pet_id < NEW.to_pet_id THEN
        smaller_pet_id := NEW.from_pet_id;
        larger_pet_id := NEW.to_pet_id;
      ELSE
        smaller_pet_id := NEW.to_pet_id;
        larger_pet_id := NEW.from_pet_id;
      END IF;

      -- Insertar el match (ON CONFLICT para evitar errores si ya existe)
      INSERT INTO matches (pet_1_id, pet_2_id)
      VALUES (smaller_pet_id, larger_pet_id)
      ON CONFLICT (pet_1_id, pet_2_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear matches automáticamente
CREATE TRIGGER create_match_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION create_match_on_mutual_like();

-- =============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCIÓN: Crear perfil automáticamente al registrarse
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario')
  );

  -- Crear suscripción gratuita por defecto
  INSERT INTO subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrarse
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- =============================================
-- VISTA: Matches con información completa
-- =============================================
CREATE OR REPLACE VIEW matches_with_details AS
SELECT
  m.id as match_id,
  m.created_at as matched_at,
  m.unmatched_at,

  -- Pet 1
  p1.id as pet1_id,
  p1.name as pet1_name,
  p1.species as pet1_species,
  p1.breed as pet1_breed,
  p1.age as pet1_age,
  p1.user_id as pet1_owner_id,

  -- Pet 2
  p2.id as pet2_id,
  p2.name as pet2_name,
  p2.species as pet2_species,
  p2.breed as pet2_breed,
  p2.age as pet2_age,
  p2.user_id as pet2_owner_id,

  -- Último mensaje
  (SELECT content FROM messages
   WHERE match_id = m.id
   ORDER BY created_at DESC LIMIT 1) as last_message,

  (SELECT created_at FROM messages
   WHERE match_id = m.id
   ORDER BY created_at DESC LIMIT 1) as last_message_at

FROM matches m
JOIN pets p1 ON m.pet_1_id = p1.id
JOIN pets p2 ON m.pet_2_id = p2.id
WHERE m.unmatched_at IS NULL;

-- =============================================
-- COMENTARIOS EN LAS TABLAS
-- =============================================
COMMENT ON TABLE profiles IS 'Usuarios/dueños de las mascotas';
COMMENT ON TABLE pets IS 'Mascotas registradas en la app';
COMMENT ON TABLE pet_photos IS 'Fotos de las mascotas (máximo 3)';
COMMENT ON TABLE likes IS 'Likes y dislikes entre mascotas';
COMMENT ON TABLE matches IS 'Matches mutuos (cuando ambas mascotas se gustaron)';
COMMENT ON TABLE messages IS 'Mensajes del chat entre matches';
COMMENT ON TABLE subscriptions IS 'Suscripciones premium de usuarios';

COMMENT ON COLUMN pets.has_pedigree IS 'Indica si la mascota tiene pedigrí certificado';
COMMENT ON COLUMN pets.is_neutered IS 'Indica si está castrado/esterilizado';
COMMENT ON COLUMN pets.ready_to_breed IS 'Indica si está disponible para cruza';
COMMENT ON COLUMN pets.has_bred_before IS 'Indica si ya ha sido cruzado anteriormente';
