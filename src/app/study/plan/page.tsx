import { Metadata } from "next";
import StudyPlanClient from "@/components/study/StudyPlanClient";

export const metadata: Metadata = {
  title: "Plano de Estudo — StudyAI",
  description: "Gere planos de estudo personalizados com IA",
};

export default function StudyPlanPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            📅 Plano de Estudo
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Informe tema, prazo e contexto de concurso (edital, banca e observações) para gerar
            um plano personalizado.
          </p>
        </div>
        <StudyPlanClient />
      </div>
    </div>
  );
}
