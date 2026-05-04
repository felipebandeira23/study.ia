import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — StudyAI",
  description: "Seu painel de estudos com IA",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const displayName =
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Estudante";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              StudyAI
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Olá, {displayName}! 👋
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              O que você vai estudar hoje?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/study/summarize"
              className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <span className="text-3xl">📝</span>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Gerar Resumo
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Cole um texto e receba um resumo de estudo completo.
                </p>
              </div>
            </Link>

            <Link
              href="/study/flashcards"
              className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <span className="text-3xl">🗂️</span>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Criar Flashcards
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Gere flashcards automáticos do seu conteúdo.
                </p>
              </div>
            </Link>

            <Link
              href="/study/plan"
              className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <span className="text-3xl">📅</span>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Plano de Estudo
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Crie um plano personalizado para qualquer tema.
                </p>
              </div>
            </Link>
          </div>

          {/* TODO: Add recent activity, study stats, and saved decks sections */}
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              📊 Estatísticas de estudo e histórico serão exibidos aqui em breve
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
