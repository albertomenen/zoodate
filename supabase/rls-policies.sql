-- =============================================
-- ZOODATE RLS (ROW LEVEL SECURITY) POLICIES
-- Políticas de seguridad para proteger los datos
-- =============================================

-- =============================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. POLICIES PARA PROFILES
-- =============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Los usuarios pueden ver perfiles de otros (para info de dueños de mascotas)
CREATE POLICY "Users can view other profiles"
  ON profiles FOR SELECT
  USING (true);

-- =============================================
-- 3. POLICIES PARA PETS
-- =============================================

-- Los usuarios pueden ver sus propias mascotas
CREATE POLICY "Users can view own pets"
  ON pets FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear mascotas
CREATE POLICY "Users can insert own pets"
  ON pets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias mascotas
CREATE POLICY "Users can update own pets"
  ON pets FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias mascotas
CREATE POLICY "Users can delete own pets"
  ON pets FOR DELETE
  USING (auth.uid() = user_id);

-- IMPORTANTE: Los usuarios pueden ver mascotas activas de otros (para matching)
CREATE POLICY "Users can view active pets for matching"
  ON pets FOR SELECT
  USING (is_active = true);

-- =============================================
-- 4. POLICIES PARA PET_PHOTOS
-- =============================================

-- Los usuarios pueden ver fotos de sus mascotas
CREATE POLICY "Users can view own pet photos"
  ON pet_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_photos.pet_id
      AND pets.user_id = auth.uid()
    )
  );

-- Los usuarios pueden subir fotos a sus mascotas
CREATE POLICY "Users can insert own pet photos"
  ON pet_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_photos.pet_id
      AND pets.user_id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar fotos de sus mascotas
CREATE POLICY "Users can delete own pet photos"
  ON pet_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_photos.pet_id
      AND pets.user_id = auth.uid()
    )
  );

-- Los usuarios pueden ver fotos de mascotas activas (para matching)
CREATE POLICY "Users can view photos of active pets"
  ON pet_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_photos.pet_id
      AND pets.is_active = true
    )
  );

-- =============================================
-- 5. POLICIES PARA LIKES
-- =============================================

-- Los usuarios pueden dar like desde sus propias mascotas
CREATE POLICY "Users can insert likes from own pets"
  ON likes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = likes.from_pet_id
      AND pets.user_id = auth.uid()
    )
  );

-- Los usuarios pueden ver likes que dieron sus mascotas
CREATE POLICY "Users can view own pets likes"
  ON likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = likes.from_pet_id
      AND pets.user_id = auth.uid()
    )
  );

-- Los usuarios pueden ver likes recibidos por sus mascotas
CREATE POLICY "Users can view likes received by own pets"
  ON likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = likes.to_pet_id
      AND pets.user_id = auth.uid()
    )
  );

-- =============================================
-- 6. POLICIES PARA MATCHES
-- =============================================

-- Los usuarios pueden ver matches de sus mascotas
CREATE POLICY "Users can view own pets matches"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE (pets.id = matches.pet_1_id OR pets.id = matches.pet_2_id)
      AND pets.user_id = auth.uid()
    )
  );

-- Los usuarios pueden "unmatch" (deshace match)
CREATE POLICY "Users can unmatch own pets"
  ON matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE (pets.id = matches.pet_1_id OR pets.id = matches.pet_2_id)
      AND pets.user_id = auth.uid()
    )
  );

-- =============================================
-- 7. POLICIES PARA MESSAGES
-- =============================================

-- Los usuarios pueden ver mensajes de sus matches
CREATE POLICY "Users can view messages from own matches"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      JOIN pets p1 ON matches.pet_1_id = p1.id
      JOIN pets p2 ON matches.pet_2_id = p2.id
      WHERE matches.id = messages.match_id
      AND (p1.user_id = auth.uid() OR p2.user_id = auth.uid())
      AND matches.unmatched_at IS NULL
    )
  );

-- Los usuarios pueden enviar mensajes desde sus mascotas
CREATE POLICY "Users can insert messages from own pets"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = messages.sender_pet_id
      AND pets.user_id = auth.uid()
    )
    AND
    -- Verificar que el match existe y está activo
    EXISTS (
      SELECT 1 FROM matches
      JOIN pets p1 ON matches.pet_1_id = p1.id
      JOIN pets p2 ON matches.pet_2_id = p2.id
      WHERE matches.id = messages.match_id
      AND (p1.user_id = auth.uid() OR p2.user_id = auth.uid())
      AND matches.unmatched_at IS NULL
    )
  );

-- Los usuarios pueden marcar mensajes como leídos
CREATE POLICY "Users can update messages read status"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches
      JOIN pets p1 ON matches.pet_1_id = p1.id
      JOIN pets p2 ON matches.pet_2_id = p2.id
      WHERE matches.id = messages.match_id
      AND (p1.user_id = auth.uid() OR p2.user_id = auth.uid())
    )
  );

-- =============================================
-- 8. POLICIES PARA SUBSCRIPTIONS
-- =============================================

-- Los usuarios pueden ver su propia suscripción
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el sistema puede crear/actualizar suscripciones (vía service_role)
-- No hay políticas INSERT/UPDATE para usuarios normales

-- =============================================
-- 9. STORAGE POLICIES PARA PET-PHOTOS BUCKET
-- =============================================

-- Permitir que cualquiera vea las fotos (bucket público)
CREATE POLICY "Public pet photos are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

-- Los usuarios pueden subir fotos
CREATE POLICY "Users can upload pet photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND auth.role() = 'authenticated'
  );

-- Los usuarios pueden actualizar sus propias fotos
CREATE POLICY "Users can update own pet photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Los usuarios pueden eliminar sus propias fotos
CREATE POLICY "Users can delete own pet photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- COMENTARIOS
-- =============================================
COMMENT ON POLICY "Users can view active pets for matching" ON pets IS
  'Permite que todos los usuarios vean mascotas activas para el sistema de matching';

COMMENT ON POLICY "Users can view photos of active pets" ON pet_photos IS
  'Permite que todos los usuarios vean fotos de mascotas activas para el swipe';

COMMENT ON POLICY "Users can view messages from own matches" ON messages IS
  'Los usuarios solo pueden ver mensajes de matches donde una de sus mascotas participó';
