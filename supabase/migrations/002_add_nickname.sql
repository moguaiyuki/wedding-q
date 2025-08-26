-- Add nickname column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(20);

-- Create unique index for nickname (allows NULL)
CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_unique ON users (nickname) WHERE nickname IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.nickname IS 'User-selected display name, max 20 chars, no emoji';