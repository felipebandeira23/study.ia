-- StudyAI RLS Policies
-- Migration: 002_rls_policies.sql

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- STUDY NOTES POLICIES
-- ============================================================
CREATE POLICY "Users can view their own notes"
  ON public.study_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON public.study_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.study_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.study_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- DECKS POLICIES
-- ============================================================
CREATE POLICY "Users can view their own decks"
  ON public.decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
  ON public.decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON public.decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON public.decks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- FLASHCARDS POLICIES
-- ============================================================
CREATE POLICY "Users can view their own flashcards"
  ON public.flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards"
  ON public.flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
  ON public.flashcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
  ON public.flashcards FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- STUDY PLANS POLICIES
-- ============================================================
CREATE POLICY "Users can view their own study plans"
  ON public.study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study plans"
  ON public.study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study plans"
  ON public.study_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- STUDY SESSIONS POLICIES
-- ============================================================
CREATE POLICY "Users can view their own study sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);
