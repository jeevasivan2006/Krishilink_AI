-- Admin Auth: password hashing & refresh tokens
-- Run via: npm run migrate

-- Add password_hash column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add refresh token columns for JWT refresh flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ;

-- Index for refresh token lookup
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token) WHERE refresh_token IS NOT NULL;

-- Set default password for seeded admin user (KrishiAdmin@2026)
-- bcrypt hash with 12 rounds
UPDATE users
SET password_hash = '$2a$12$LJ3m4ys3Gm.N7QKXVuUYYOiGkDzMQ7PjHv5N1v7.bPYqp3HMxa/yO'
WHERE email = 'admin@krishilink.in'
  AND password_hash IS NULL;
