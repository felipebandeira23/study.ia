export type StudyLevel = "iniciante" | "intermediário" | "avançado";

export interface Flashcard {
  id?: string;
  front: string;
  back: string;
  deck_id?: string;
  created_at?: string;
}

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  topic?: string;
  created_at: string;
  updated_at: string;
  flashcards?: Flashcard[];
}

export interface StudySession {
  id: string;
  user_id: string;
  deck_id: string;
  started_at: string;
  finished_at?: string;
  cards_reviewed: number;
  correct_answers: number;
}

export interface StudyNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary?: string;
  topic?: string;
  created_at: string;
  updated_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  topic: string;
  duration_days: number;
  level: StudyLevel;
  plan_content: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}
