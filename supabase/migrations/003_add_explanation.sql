-- Add explanation columns to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation_text TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation_image_url TEXT;

-- Add comments
COMMENT ON COLUMN questions.explanation_text IS 'Text explanation shown after revealing the answer';
COMMENT ON COLUMN questions.explanation_image_url IS 'Image URL for visual explanation';