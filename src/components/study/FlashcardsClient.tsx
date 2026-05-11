"use client";

import Link from "next/link";
import { useState } from "react";
import { Flashcard } from "@/types";

export default function FlashcardsClient() {
  const [content, setContent] = useState("");
  const [count, setCount] = useState(10);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [deck, setDeck] = useState<{ id: string; title: string } | null>(null);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFlashcards([]);
    setFlipped({});
    setDeck(null);

    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, count }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar flashcards");
        return;
      }

      setFlashcards(data.flashcards);
      setDeck(data.deck ?? null);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function toggleFlip(index: number) {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Conteúdo para gerar flashcards
          </label>
          <textarea
            id="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole aqui o texto que deseja converter em flashcards..."
            rows={8}
            className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="count"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Quantidade de flashcards: {count}
          </label>
          <input
            id="count"
            type="range"
            min={5}
            max={50}
            step={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>5</span>
            <span>50</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || content.trim().length === 0}
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Gerando flashcards..." : "Gerar Flashcards"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {flashcards.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            🗂️ {flashcards.length} flashcards gerados — clique para virar
          </h2>
          {deck && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <p className="text-emerald-700 dark:text-emerald-400">
                ✅ Deck salvo no histórico: {deck.title}
              </p>
              <Link
                href={`/study/review/${deck.id}`}
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Revisar agora →
              </Link>
              <Link
                href={`/study/decks/${deck.id}`}
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Gerenciar deck →
              </Link>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {flashcards.map((card, i) => (
              <button
                key={i}
                onClick={() => toggleFlip(i)}
                className="group relative h-40 w-full text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <div className="absolute top-3 right-3 text-xs text-zinc-400">
                  {flipped[i] ? "Resposta" : "Pergunta"} • {i + 1}/{flashcards.length}
                </div>
                <div className="flex h-full items-center">
                  <p className="text-sm text-zinc-900 dark:text-zinc-50 font-medium leading-relaxed">
                    {flipped[i] ? card.back : card.front}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
