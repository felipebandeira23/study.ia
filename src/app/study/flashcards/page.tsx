import { Metadata } from "next";
import FlashcardsClient from "@/components/study/FlashcardsClient";

export const metadata: Metadata = {
  title: "Criar Flashcards — StudyAI",
  description: "Gere flashcards automáticos com IA",
};

export default function FlashcardsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            🗂️ Criar Flashcards
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Gere flashcards de estudo automáticos a partir do seu conteúdo.
          </p>
        </div>
        <FlashcardsClient />
      </div>
    </div>
  );
}
