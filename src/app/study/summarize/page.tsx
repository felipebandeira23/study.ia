import { Metadata } from "next";
import SummarizeClient from "@/components/study/SummarizeClient";

export const metadata: Metadata = {
  title: "Gerar Resumo — StudyAI",
  description: "Gere resumos de estudo inteligentes com IA",
};

export default function SummarizePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            📝 Gerar Resumo
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Cole o conteúdo que deseja estudar e a IA criará um resumo
            organizado.
          </p>
        </div>
        <SummarizeClient />
      </div>
    </div>
  );
}
