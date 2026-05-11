"use client";

import { useState } from "react";
import { StudyLevel } from "@/types";

export default function StudyPlanClient() {
  const [topic, setTopic] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [level, setLevel] = useState<StudyLevel>("iniciante");
  const [plan, setPlan] = useState<string | null>(null);
  const [savedPlan, setSavedPlan] = useState<{ id: string; topic: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlan(null);
    setSavedPlan(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, durationDays, level }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar plano");
        return;
      }

      setPlan(data.plan);
      setSavedPlan(data.studyPlan ?? null);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const levels: { value: StudyLevel; label: string }[] = [
    { value: "iniciante", label: "Iniciante" },
    { value: "intermediário", label: "Intermediário" },
    { value: "avançado", label: "Avançado" },
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Tema a estudar
          </label>
          <input
            id="topic"
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Álgebra Linear, React.js, Fotossíntese..."
            className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="duration"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Duração do plano: {durationDays} dias
          </label>
          <input
            id="duration"
            type="range"
            min={7}
            max={90}
            step={7}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>1 semana</span>
            <span>3 meses</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nível de conhecimento
          </span>
          <div className="flex gap-3">
            {levels.map(({ value, label }) => (
              <label
                key={value}
                className={`flex-1 flex items-center justify-center rounded-full border py-2 text-sm font-medium cursor-pointer transition-colors ${
                  level === value
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                }`}
              >
                <input
                  type="radio"
                  name="level"
                  value={value}
                  checked={level === value}
                  onChange={() => setLevel(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || topic.trim().length === 0}
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Gerando plano..." : "Gerar Plano de Estudo"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {plan && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            📅 Plano de estudo: {topic}
          </h2>
          {savedPlan && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              ✅ Plano salvo no histórico para: {savedPlan.topic}
            </p>
          )}
          <div className="prose prose-zinc dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
            {plan}
          </div>
        </div>
      )}
    </div>
  );
}
