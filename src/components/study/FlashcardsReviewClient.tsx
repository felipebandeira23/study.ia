"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ReviewFlashcard = {
  id: string;
  front: string;
  back: string;
};

type FlashcardsReviewClientProps = {
  deckId: string;
  deckTitle: string;
  sessionId: string;
  flashcards: ReviewFlashcard[];
};

export default function FlashcardsReviewClient({
  deckId,
  deckTitle,
  sessionId,
  flashcards,
}: FlashcardsReviewClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  const totalCards = flashcards.length;
  const currentCard = flashcards[currentIndex];
  const reviewedCount = useMemo(() => Object.keys(answers).length, [answers]);
  const correctCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );
  const progressPercent = totalCards > 0 ? (reviewedCount / totalCards) * 100 : 0;

  async function persistProgress(
    nextReviewedCount: number,
    nextCorrectCount: number,
    shouldFinish: boolean
  ) {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/study-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          cardsReviewed: nextReviewedCount,
          correctAnswers: nextCorrectCount,
          finished: shouldFinish,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Não foi possível salvar seu progresso.");
      }
    } catch {
      setSaveError("Erro de rede ao salvar progresso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAnswer(correct: boolean) {
    const nextAnswers = { ...answers, [currentIndex]: correct };
    const nextReviewedCount = Object.keys(nextAnswers).length;
    const nextCorrectCount = Object.values(nextAnswers).filter(Boolean).length;
    const shouldFinish = !finished && nextReviewedCount === totalCards;

    setAnswers(nextAnswers);
    setShowAnswer(false);

    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
    }

    if (shouldFinish) {
      setFinished(true);
    }

    await persistProgress(nextReviewedCount, nextCorrectCount, shouldFinish);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            📚 Revisão de Flashcards
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{deckTitle}</p>
        </div>
        <Link
          href={`/study/review/${deckId}`}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Reiniciar
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Card {currentIndex + 1}/{totalCards}
          </p>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Revisados {reviewedCount}/{totalCards}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {showAnswer ? "Resposta" : "Pergunta"}
        </p>
        <p className="mt-3 min-h-28 text-lg font-semibold leading-relaxed text-zinc-900 dark:text-zinc-50">
          {showAnswer ? currentCard.back : currentCard.front}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowAnswer((prev) => !prev)}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {showAnswer ? "Ocultar resposta" : "Revelar resposta"}
          </button>

          {showAnswer && (
            <>
              <button
                type="button"
                onClick={() => handleMarkAnswer(true)}
                className="rounded-full border border-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
              >
                Acertei
              </button>
              <button
                type="button"
                onClick={() => handleMarkAnswer(false)}
                className="rounded-full border border-amber-300 px-5 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
              >
                Errei
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setCurrentIndex((prev) => Math.max(prev - 1, 0));
            setShowAnswer(false);
          }}
          disabled={currentIndex === 0}
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ← Anterior
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentIndex((prev) => Math.min(prev + 1, totalCards - 1));
            setShowAnswer(false);
          }}
          disabled={currentIndex === totalCards - 1}
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Próximo →
        </button>
      </div>

      {finished && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400">
          ✅ Revisão concluída! Você acertou {correctCount} de {totalCards} cards.
        </div>
      )}

      {saving && <p className="text-xs text-zinc-500 dark:text-zinc-400">Salvando progresso...</p>}
      {saveError && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {saveError} Tente continuar e recarregar ao final.
        </p>
      )}
    </div>
  );
}
