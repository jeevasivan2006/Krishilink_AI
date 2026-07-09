-- Farmer Profiles table
-- Run via: npm run migrate

CREATE TABLE IF NOT EXISTS farmer_profiles (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  farm_name     VARCHAR(100),
  farm_location VARCHAR(200),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id ON farmer_profiles(user_id);

CREATE OR REPLACE FUNCTION update_farmer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_farmer_profiles_updated_at ON farmer_profiles;
CREATE TRIGGER trg_farmer_profiles_updated_at
  BEFORE UPDATE ON farmer_profiles FOR EACH ROW
  EXECUTE PROCEDURE update_farmer_profiles_updated_at();
