-- =============================================
-- Añadir campo push_token a profiles
-- =============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

COMMENT ON COLUMN profiles.push_token IS 'Token de Expo Push Notifications para enviar notificaciones al dispositivo del usuario';
