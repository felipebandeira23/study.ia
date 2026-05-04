"use client";

import { useState } from "react";

export default function SummarizeClient() {
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar resumo");
        return;
      }

      setSummary(data.summary);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Conteúdo para resumir
          </label>
          <textarea
            id="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole aqui o texto, capítulo ou anotações que deseja resumir..."
            rows={10}
            className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
          />
          <p className="text-xs text-zinc-500">{content.length} / 50.000 caracteres</p>
        </div>

        <button
          type="submit"
          disabled={loading || content.trim().length === 0}
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Gerando resumo..." : "Gerar Resumo"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {summary && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            📋 Resumo gerado
          </h2>
          <div className="prose prose-zinc dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}
