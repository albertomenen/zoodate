-- =============================================
-- FIX: Arreglar el trigger de nuevo usuario
-- =============================================

-- 1. Eliminar el trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Arreglar la constraint de subscriptions que causa conflicto
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_status_key;

-- 3. Recrear la función corregida
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear perfil
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar el registro
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear el trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
