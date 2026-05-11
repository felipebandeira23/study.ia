import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import FlashcardsReviewClient from "@/components/study/FlashcardsReviewClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Revisar Flashcards — StudyAI",
  description: "Revise seus flashcards com progresso de estudo",
};

type ReviewPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function ReviewDeckPage({ params }: ReviewPageProps) {
  const { deckId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!deck) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Deck não encontrado
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Este deck não existe ou não pertence à sua conta.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("id, front, back")
    .eq("deck_id", deck.id)
    .order("created_at", { ascending: true });

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Deck sem cards
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            O deck <strong>{deck.title}</strong> ainda não possui flashcards para revisão.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/study/flashcards"
              className="inline-flex rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Criar flashcards
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Voltar ao dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data: activeSession } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("deck_id", deck.id)
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let currentSession = activeSession;
  let sessionError = null;

  if (!currentSession) {
    const sessionInsertResult = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        deck_id: deck.id,
        cards_reviewed: 0,
        correct_answers: 0,
      })
      .select("id")
      .single();

    currentSession = sessionInsertResult.data;
    sessionError = sessionInsertResult.error;
  }

  if (sessionError || !currentSession) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Erro ao iniciar revisão
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Não foi possível iniciar sua sessão de estudo agora. Tente novamente.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl space-y-6">
        <FlashcardsReviewClient
          deckTitle={deck.title}
          sessionId={currentSession.id}
          flashcards={flashcards}
        />
      </div>
    </div>
  );
}
