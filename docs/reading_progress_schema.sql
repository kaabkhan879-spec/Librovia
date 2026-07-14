-- Create reading_progress table if not exists
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  current_page INT NOT NULL DEFAULT 1,
  total_pages INT,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reading_time INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, book_id)
);

-- Ensure RLS is active
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- Configure RLS Policies
DROP POLICY IF EXISTS "Allow users to manage their own reading progress" ON public.reading_progress;
CREATE POLICY "Allow users to manage their own reading progress" ON public.reading_progress
  FOR ALL USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS reading_progress_user_book_idx ON public.reading_progress (user_id, book_id);
