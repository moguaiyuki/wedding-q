-- Add multiple_answer question type and choice points
-- This migration extends the schema to support multiple-answer questions
-- where each choice has its own point value

-- 1. Add 'multiple_answer' to question_type enum
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions
ADD CONSTRAINT questions_question_type_check
CHECK (question_type IN ('multiple_choice', 'free_text', 'multiple_answer'));

-- 2. Add points column to choices table
-- This allows each choice to have individual point values (positive or negative)
ALTER TABLE choices
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 3. Migrate existing data: set points for existing multiple_choice questions
-- Correct choices get the question's point value, incorrect choices get 0
UPDATE choices c
SET points = CASE
  WHEN c.is_correct THEN (SELECT points FROM questions WHERE id = c.question_id)
  ELSE 0
END
WHERE EXISTS (
  SELECT 1 FROM questions q
  WHERE q.id = c.question_id
  AND q.question_type = 'multiple_choice'
)
AND c.points = 0; -- Only update if not already set

-- 4. Add selected_choice_ids column to answers table
-- This stores multiple selected choices as a JSON array
ALTER TABLE answers
ADD COLUMN IF NOT EXISTS selected_choice_ids JSONB;

-- 5. Migrate existing data: convert choice_id to selected_choice_ids array
UPDATE answers
SET selected_choice_ids = jsonb_build_array(choice_id::text)
WHERE choice_id IS NOT NULL
AND selected_choice_ids IS NULL;

-- 6. Create index for selected_choice_ids for better query performance
CREATE INDEX IF NOT EXISTS idx_answers_selected_choice_ids
ON answers USING GIN (selected_choice_ids);

-- 7. Add comment for documentation
COMMENT ON COLUMN choices.points IS 'Point value for this choice. Positive for correct answers to add, negative for incorrect answers to subtract.';
COMMENT ON COLUMN answers.selected_choice_ids IS 'Array of choice IDs selected by the user (for multiple_answer questions).';
