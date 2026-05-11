import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getContestNewsFeed } from "@/lib/contests/news-feed";

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

type TrackedContest = {
  id: string;
  name: string;
  organizer: string | null;
  exam_date: string | null;
  notes: string | null;
  created_at: string;
};

type DashboardPageProps = {
  searchParams?: Promise<{
    contestSearch?: string;
  }>;
};

async function addTrackedContestAction(formData: FormData) {
  "use server";

  const name = formData.get("name");
  const organizer = formData.get("organizer");
  const examDate = formData.get("examDate");
  const notes = formData.get("notes");

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  await supabase.from("tracked_contests").insert({
    user_id: user.id,
    name: name.trim().slice(0, 140),
    organizer: typeof organizer === "string" && organizer.trim() ? organizer.trim().slice(0, 120) : null,
    exam_date:
      typeof examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(examDate) ? examDate : null,
    notes: typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 2000) : null,
  });

  revalidatePath("/dashboard");
}

async function removeTrackedContestAction(formData: FormData) {
  "use server";

  const contestId = formData.get("contestId");
  if (!contestId || typeof contestId !== "string") {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  await supabase.from("tracked_contests").delete().eq("id", contestId).eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const contestSearchRaw = resolvedSearchParams?.contestSearch;
  const contestSearch = typeof contestSearchRaw === "string" ? contestSearchRaw.trim() : "";

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
    trackedContestsResult,
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
    supabase
      .from("tracked_contests")
      .select("id, name, organizer, exam_date, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const notesCount = notesCountResult.count ?? 0;
  const decksCount = decksCountResult.count ?? 0;
  const flashcardsCount = flashcardsCountResult.count ?? 0;
  const plansCount = plansCountResult.count ?? 0;
  const trackedContests = (trackedContestsResult.data ?? []) as TrackedContest[];
  let contestFeed: Awaited<ReturnType<typeof getContestNewsFeed>> = [];

  try {
    contestFeed = await getContestNewsFeed(
      trackedContests.map((contest) => ({
        name: contest.name,
        organizer: contest.organizer,
        examDate: contest.exam_date,
        notes: contest.notes,
      })),
      6,
      contestSearch
    );
  } catch (error) {
    console.error("Error loading contest news feed:", error);
  }

  const recentActivity: RecentActivity[] = [
    ...(notesRecentResult.data ?? []).map((note) => ({
      id: note.id,
      type: "Resumo" as const,
      title: note.title,
      created_at: note.created_at,
      href: `/study/notes/${note.id}`,
    })),
    ...(decksRecentResult.data ?? []).map((deck) => ({
      id: deck.id,
      type: "Deck" as const,
      title: deck.title,
      created_at: deck.created_at,
      href: `/study/decks/${deck.id}`,
    })),
    ...(plansRecentResult.data ?? []).map((plan) => ({
      id: plan.id,
      type: "Plano" as const,
      title: plan.topic,
      created_at: plan.created_at,
      href: `/study/plans/${plan.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const stats = [
    { label: "Resumos salvos", value: notesCount, icon: "📝" },
    { label: "Decks criados", value: decksCount, icon: "🗂️" },
    { label: "Flashcards totais", value: flashcardsCount, icon: "🧠" },
    { label: "Planos de estudo", value: plansCount, icon: "📅" },
    { label: "Concursos rastreados", value: trackedContests.length, icon: "📌" },
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              Gerenciar conteúdo salvo
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/study/notes"
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Ver resumos salvos
              </Link>
              <Link
                href="/study/decks"
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Ver decks salvos
              </Link>
              <Link
                href="/study/plans"
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Ver planos salvos
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  📌 Concursos rastreados
                </h2>
                <Link
                  href="/study/plan"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Gerar plano →
                </Link>
              </div>

              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Pesquise/informe um concurso para acompanhar notícias e usar contexto no plano.
              </p>

              <form action={addTrackedContestAction} className="mt-4 space-y-3">
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={140}
                  placeholder="Ex: INSS 2026, TRT 2ª Região, Polícia Federal"
                  className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    name="organizer"
                    maxLength={120}
                    placeholder="Banca/organizador (opcional)"
                    className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                  <input
                    type="date"
                    name="examDate"
                    className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <textarea
                  name="notes"
                  rows={2}
                  maxLength={2000}
                  placeholder="Observações rápidas (disciplinas, edital, prioridades)."
                  className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                <button
                  type="submit"
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Rastrear concurso
                </button>
              </form>

              {trackedContests.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Nenhum concurso rastreado ainda.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {trackedContests.map((contest) => (
                    <li
                      key={contest.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {contest.name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {contest.organizer ? `${contest.organizer} • ` : ""}
                          {contest.exam_date
                            ? `Prova: ${new Date(contest.exam_date).toLocaleDateString("pt-BR")}`
                            : "Data da prova não informada"}
                        </p>
                      </div>
                      <form action={removeTrackedContestAction}>
                        <input type="hidden" name="contestId" value={contest.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          Remover
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                📰 Feed de notícias de concursos
              </h2>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Notícias reais consultadas em RSS estruturado de fontes confiáveis. Use a pesquisa
                para rastrear atualizações de um concurso específico.
              </p>

              <form className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="search"
                  name="contestSearch"
                  defaultValue={contestSearch}
                  placeholder="Pesquisar concurso (ex: INSS, TJSP, Polícia Federal)"
                  className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                <button
                  type="submit"
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Pesquisar
                </button>
                {contestSearch ? (
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Limpar
                  </Link>
                ) : null}
              </form>

              {contestFeed.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Nenhuma notícia encontrada para os filtros atuais.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {contestFeed.map((item, index) => (
                    <li
                      key={`${item.title}-${index}`}
                      className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Concurso relacionado: {item.contestName || "Não identificado"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{item.summary}</p>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Fonte: {item.source}
                      </p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Abrir notícia →
                      </a>
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Publicação:{" "}
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleString("pt-BR")
                          : "Não informada"}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.aiAssisted
                          ? "Resumo/relevância organizados com apoio de IA."
                          : "Resumo exibido diretamente da fonte (sem IA)."}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
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
