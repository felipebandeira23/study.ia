-- StudyAI Contests Module
-- Migration: 003_contests_module.sql

-- ============================================================
-- TRACKED CONTESTS
-- User-tracked concursos públicos and optional context
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tracked_contests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  organizer             TEXT,
  exam_date             DATE,
  edital_text           TEXT,
  notes                 TEXT,
  previous_exams_notes  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracked_contests_user_id ON public.tracked_contests(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_contests_exam_date ON public.tracked_contests(exam_date);

DROP TRIGGER IF EXISTS set_tracked_contests_updated_at ON public.tracked_contests;
CREATE TRIGGER set_tracked_contests_updated_at
  BEFORE UPDATE ON public.tracked_contests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- STUDY PLANS EXTRA CONTEXT FOR CONCURSOS
-- ============================================================
ALTER TABLE public.study_plans
  ADD COLUMN IF NOT EXISTS contest_name TEXT,
  ADD COLUMN IF NOT EXISTS contest_organizer TEXT,
  ADD COLUMN IF NOT EXISTS contest_exam_date DATE,
  ADD COLUMN IF NOT EXISTS contest_edital_text TEXT,
  ADD COLUMN IF NOT EXISTS contest_notes TEXT,
  ADD COLUMN IF NOT EXISTS previous_exams_notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS set_study_plans_updated_at ON public.study_plans;
CREATE TRIGGER set_study_plans_updated_at
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS FOR TRACKED CONTESTS + UPDATE POLICY FOR STUDY PLANS
-- ============================================================
ALTER TABLE public.tracked_contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tracked contests"
  ON public.tracked_contests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tracked contests"
  ON public.tracked_contests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked contests"
  ON public.tracked_contests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked contests"
  ON public.tracked_contests FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own study plans"
  ON public.study_plans FOR UPDATE
  USING (auth.uid() = user_id);
