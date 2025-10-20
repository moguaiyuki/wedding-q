-- Add message and message_image_url columns to users table
-- These columns store personalized messages and images for each participant

-- Add message column (up to 1000 characters)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add message_image_url column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS message_image_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.message IS '参加者へのメッセージ（最大1000文字、任意）';
COMMENT ON COLUMN users.message_image_url IS 'メッセージ用画像のURL（任意）';
