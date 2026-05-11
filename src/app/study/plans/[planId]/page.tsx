import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plano Salvo — StudyAI",
  description: "Visualize um plano salvo",
};

type PlanDetailPageProps = {
  params: Promise<{ planId: string }>;
};

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { planId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: plan } = await supabase
    .from("study_plans")
    .select(
      "id, topic, level, duration_days, plan_content, created_at, contest_name, contest_organizer, contest_exam_date, contest_notes"
    )
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plan) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Plano não encontrado</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Este plano não existe ou não pertence à sua conta.
          </p>
          <Link
            href="/study/plans"
            className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Voltar para planos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{plan.topic}</h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {plan.level} • {plan.duration_days} dias • {new Date(plan.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
          <Link
            href="/study/plans"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Voltar para lista
          </Link>
          <Link
            href={`/study/plans/${plan.id}/edit`}
            className="rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            Editar e regenerar
          </Link>
        </div>

        {(plan.contest_name || plan.contest_organizer || plan.contest_exam_date || plan.contest_notes) && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Contexto de concurso
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {plan.contest_name && (
                <li>
                  <strong>Concurso:</strong> {plan.contest_name}
                </li>
              )}
              {plan.contest_organizer && (
                <li>
                  <strong>Banca:</strong> {plan.contest_organizer}
                </li>
              )}
              {plan.contest_exam_date && (
                <li>
                  <strong>Prova:</strong>{" "}
                  {new Date(plan.contest_exam_date).toLocaleDateString("pt-BR")}
                </li>
              )}
              {plan.contest_notes && (
                <li>
                  <strong>Observações:</strong> {plan.contest_notes}
                </li>
              )}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Plano de estudo</h2>
          <div className="prose prose-zinc mt-3 max-w-none whitespace-pre-wrap text-sm dark:prose-invert">
            {plan.plan_content}
          </div>
        </section>
      </div>
    </div>
  );
}
