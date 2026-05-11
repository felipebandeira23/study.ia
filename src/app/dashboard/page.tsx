import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — StudyAI",
  description: "Seu painel de estudos com IA",
};

type RecentActivity = {
  id: string;
  type: "Resumo" | "Deck" | "Plano";
  title: string;
  created_at: string;
  href: string;
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

  const [
    notesCountResult,
    decksCountResult,
    flashcardsCountResult,
    plansCountResult,
    notesRecentResult,
    decksRecentResult,
    plansRecentResult,
  ] = await Promise.all([
    supabase.from("study_notes").select("id", { count: "exact", head: true }),
    supabase.from("decks").select("id", { count: "exact", head: true }),
    supabase.from("flashcards").select("id", { count: "exact", head: true }),
    supabase.from("study_plans").select("id", { count: "exact", head: true }),
    supabase
      .from("study_notes")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("decks")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("study_plans")
      .select("id, topic, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const notesCount = notesCountResult.count ?? 0;
  const decksCount = decksCountResult.count ?? 0;
  const flashcardsCount = flashcardsCountResult.count ?? 0;
  const plansCount = plansCountResult.count ?? 0;

  const recentActivity: RecentActivity[] = [
    ...(notesRecentResult.data ?? []).map((note) => ({
      id: note.id,
      type: "Resumo" as const,
      title: note.title,
      created_at: note.created_at,
      href: "/study/summarize",
    })),
    ...(decksRecentResult.data ?? []).map((deck) => ({
      id: deck.id,
      type: "Deck" as const,
      title: deck.title,
      created_at: deck.created_at,
      href: `/study/review/${deck.id}`,
    })),
    ...(plansRecentResult.data ?? []).map((plan) => ({
      id: plan.id,
      type: "Plano" as const,
      title: plan.topic,
      created_at: plan.created_at,
      href: "/study/plan",
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const stats = [
    { label: "Resumos salvos", value: notesCount, icon: "📝" },
    { label: "Decks criados", value: decksCount, icon: "🗂️" },
    { label: "Flashcards totais", value: flashcardsCount, icon: "🧠" },
    { label: "Planos de estudo", value: plansCount, icon: "📅" },
  ];

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
              >
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stat.icon} {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Atividade recente
            </h2>

            {recentActivity.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                Ainda não há histórico. Gere seu primeiro resumo, deck ou plano.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {recentActivity.map((item) => (
                  <li
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-none last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                        {item.type}: {item.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Link
                      href={item.href}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Ver
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
