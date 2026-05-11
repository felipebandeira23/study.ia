import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planos Salvos — StudyAI",
  description: "Gerencie seus planos de estudo salvos",
};

async function deletePlanAction(formData: FormData) {
  "use server";

  const planId = formData.get("planId");
  if (!planId || typeof planId !== "string") {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  await supabase
    .from("study_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id);

  revalidatePath("/study/plans");
  revalidatePath("/dashboard");
}

export default async function SavedPlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: plans } = await supabase
    .from("study_plans")
    .select("id, topic, level, duration_days, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">📅 Planos salvos</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Consulte e remova planos de estudo gerados.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/study/plan"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Gerar plano
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          {!plans || plans.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Você ainda não possui planos salvos.
            </p>
          ) : (
            <ul className="space-y-3">
              {plans.map((plan) => (
                <li
                  key={plan.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {plan.topic}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {plan.level} • {plan.duration_days} dias
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(plan.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/study/plans/${plan.id}`}
                      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Abrir
                    </Link>
                    <form action={deletePlanAction}>
                      <input type="hidden" name="planId" value={plan.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
