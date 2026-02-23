-- Pétmongo MVP database schema (PostgreSQL)

CREATE TABLE cities (
  id UUID PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone VARCHAR(32) UNIQUE,
  email VARCHAR(120) UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  nickname VARCHAR(64),
  avatar_url TEXT,
  cover_url TEXT,
  city VARCHAR(64),
  bio TEXT,
  pet_name VARCHAR(64),
  pet_breed VARCHAR(64),
  pet_gender VARCHAR(16),
  pet_birthday DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE resources (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  city_id UUID NOT NULL REFERENCES cities(id),
  cover_url TEXT,
  location_hint VARCHAR(160),
  safety_note VARCHAR(240),
  best_time VARCHAR(64),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resource_tags (
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  resource_id UUID REFERENCES resources(id),
  submitter_id UUID,
  payload JSONB NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  reviewer_id UUID,
  review_note VARCHAR(240),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE media_assets (
  id UUID PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL,
  url TEXT NOT NULL,
  thumb_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE discover_posts (
  id UUID PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  author_name VARCHAR(64) NOT NULL,
  author_avatar_url TEXT,
  cover_url TEXT,
  media_url TEXT,
  category VARCHAR(32) NOT NULL,
  city VARCHAR(64),
  tags TEXT[] NOT NULL DEFAULT '{}',
  post_type VARCHAR(16) NOT NULL DEFAULT 'image',
  likes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
