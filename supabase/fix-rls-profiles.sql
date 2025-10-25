-- =============================================
-- FIX: Permitir que usuarios creen su propio perfil
-- =============================================

-- Permitir que los usuarios inserten su propio perfil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
