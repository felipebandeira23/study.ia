"use client";

import Link from "next/link";
import { useState } from "react";

const MAX_CONTENT_CHARS = 50000;

export default function SummarizeClient() {
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (content.trim().length === 0 && !pdfFile) {
      setError("Informe um texto para resumo ou envie um arquivo PDF.");
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);
    setSavedNote(null);

    try {
      const requestInit: RequestInit = { method: "POST" };

      if (pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        formData.append("content", content);
        requestInit.body = formData;
      } else {
        requestInit.headers = { "Content-Type": "application/json" };
        requestInit.body = JSON.stringify({ content });
      }

      const res = await fetch("/api/ai/summarize", requestInit);

      let data: { error?: string; summary?: string; note?: { id: string; title: string }; saved?: boolean } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar resumo");
        return;
      }

      if (!data.summary) {
        setError("Não foi possível gerar o resumo. Tente novamente.");
        return;
      }

      setSummary(data.summary);
      setSavedNote(data.saved !== false ? (data.note ?? null) : null);
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
            Conteúdo para resumir (opcional se enviar PDF)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole aqui o texto, capítulo ou anotações que deseja resumir..."
            rows={10}
            maxLength={MAX_CONTENT_CHARS}
            className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
          />
          <p className="text-xs text-zinc-500">
            {content.length} / {MAX_CONTENT_CHARS.toLocaleString("pt-BR")} caracteres
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="pdf-file"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Upload de PDF (opcional)
          </label>
          <input
            id="pdf-file"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPdfFile(file);
            }}
            className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 dark:text-zinc-50"
          />
          <p className="text-xs text-zinc-500">
            Envie um PDF com até 10MB. Se houver arquivo, o resumo usará o texto extraído dele.
          </p>
          {pdfFile && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Arquivo selecionado: <span className="font-medium">{pdfFile.name}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (content.trim().length === 0 && !pdfFile)}
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (pdfFile ? "Processando PDF e gerando resumo..." : "Gerando resumo...") : "Gerar Resumo"}
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
          {savedNote && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <p className="text-emerald-700 dark:text-emerald-400">
                ✅ Salvo no histórico como: {savedNote.title}
              </p>
              <Link
                href={`/study/notes/${savedNote.id}`}
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Abrir resumo salvo →
              </Link>
            </div>
          )}
          <div className="prose prose-zinc dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}
