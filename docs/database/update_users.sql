-- Ensure users table exists first
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  phone VARCHAR(32) UNIQUE,
  email VARCHAR(120) UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  nickname VARCHAR(64),
  avatar_url TEXT,
  city VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Then add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pet_name VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pet_breed VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pet_gender VARCHAR(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pet_birthday DATE;
