import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateStudyPlan } from "@/lib/ai/gemini";
import { StudyLevel } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar Plano — StudyAI",
  description: "Edite e regenere um plano de estudos contextualizado",
};

type EditPlanPageProps = {
  params: Promise<{ planId: string }>;
};

type PlanContextRow = {
  id: string;
  topic: string;
  duration_days: number;
  level: StudyLevel;
  plan_content: string;
  contest_name: string | null;
  contest_organizer: string | null;
  contest_exam_date: string | null;
  contest_edital_text: string | null;
  contest_notes: string | null;
  previous_exams_notes: string | null;
};

async function regeneratePlanAction(formData: FormData) {
  "use server";

  const planId = formData.get("planId");
  const topic = formData.get("topic");
  const durationDays = formData.get("durationDays");
  const level = formData.get("level");
  const contestName = formData.get("contestName");
  const organizer = formData.get("organizer");
  const examDate = formData.get("examDate");
  const editalText = formData.get("editalText");
  const notes = formData.get("notes");
  const previousExamsNotes = formData.get("previousExamsNotes");

  if (
    !planId ||
    typeof planId !== "string" ||
    !topic ||
    typeof topic !== "string" ||
    !durationDays ||
    typeof durationDays !== "string" ||
    !level ||
    typeof level !== "string"
  ) {
    return;
  }

  const validLevels: StudyLevel[] = ["iniciante", "intermediário", "avançado"];
  const parsedLevel = validLevels.includes(level as StudyLevel)
    ? (level as StudyLevel)
    : "iniciante";
  const parsedDays = Math.min(Math.max(Number(durationDays) || 30, 1), 365);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const nextPlanContent = await generateStudyPlan(topic, parsedDays, parsedLevel, {
    contestName: typeof contestName === "string" ? contestName.trim() : "",
    organizer: typeof organizer === "string" ? organizer.trim() : "",
    examDate:
      typeof examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(examDate) ? examDate : "",
    editalText: typeof editalText === "string" ? editalText.trim() : "",
    notes: typeof notes === "string" ? notes.trim() : "",
    previousExamsNotes:
      typeof previousExamsNotes === "string" ? previousExamsNotes.trim() : "",
  });

  await supabase
    .from("study_plans")
    .update({
      topic: topic.trim().slice(0, 160),
      duration_days: parsedDays,
      level: parsedLevel,
      plan_content: nextPlanContent,
      contest_name: typeof contestName === "string" && contestName.trim() ? contestName.trim() : null,
      contest_organizer: typeof organizer === "string" && organizer.trim() ? organizer.trim() : null,
      contest_exam_date:
        typeof examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(examDate) ? examDate : null,
      contest_edital_text:
        typeof editalText === "string" && editalText.trim() ? editalText.trim() : null,
      contest_notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      previous_exams_notes:
        typeof previousExamsNotes === "string" && previousExamsNotes.trim()
          ? previousExamsNotes.trim()
          : null,
    })
    .eq("id", planId)
    .eq("user_id", user.id);

  revalidatePath(`/study/plans/${planId}`);
  revalidatePath("/study/plans");
  revalidatePath("/dashboard");
  redirect(`/study/plans/${planId}`);
}

export default async function EditPlanPage({ params }: EditPlanPageProps) {
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
      "id, topic, duration_days, level, plan_content, contest_name, contest_organizer, contest_exam_date, contest_edital_text, contest_notes, previous_exams_notes"
    )
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle<PlanContextRow>();

  if (!plan) {
    redirect("/study/plans");
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Editar e regenerar plano
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Atualize o contexto do concurso e regenere o plano com IA.
            </p>
          </div>
          <Link
            href={`/study/plans/${plan.id}`}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Voltar ao plano
          </Link>
        </div>

        <form
          action={regeneratePlanAction}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <input type="hidden" name="planId" value={plan.id} />
          <div className="space-y-1">
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Tema principal
            </label>
            <input
              id="topic"
              name="topic"
              defaultValue={plan.topic}
              required
              maxLength={160}
              className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="durationDays"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Duração (dias)
              </label>
              <input
                id="durationDays"
                name="durationDays"
                type="number"
                min={1}
                max={365}
                defaultValue={plan.duration_days}
                className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="level"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Nível
              </label>
              <select
                id="level"
                name="level"
                defaultValue={plan.level}
                className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="iniciante">Iniciante</option>
                <option value="intermediário">Intermediário</option>
                <option value="avançado">Avançado</option>
              </select>
            </div>
          </div>

          <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Contexto de concurso
            </h2>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              A IA usa os dados abaixo para reprocessar o plano. Se faltar informação, ela indicará
              suposições.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                name="contestName"
                defaultValue={plan.contest_name ?? ""}
                placeholder="Nome do concurso"
                className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <input
                name="organizer"
                defaultValue={plan.contest_organizer ?? ""}
                placeholder="Banca/organizador"
                className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <input
                name="examDate"
                type="date"
                defaultValue={plan.contest_exam_date ?? ""}
                className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <textarea
              name="editalText"
              rows={5}
              defaultValue={plan.contest_edital_text ?? ""}
              placeholder="Trechos do edital, disciplinas e critérios."
              className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <textarea
              name="previousExamsNotes"
              rows={3}
              defaultValue={plan.previous_exams_notes ?? ""}
              placeholder="Informações de provas anteriores (quando disponíveis)."
              className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <textarea
              name="notes"
              rows={3}
              defaultValue={plan.contest_notes ?? ""}
              placeholder="Observações adicionais."
              className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </section>

          <button
            type="submit"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Regenerar plano com contexto
          </button>
        </form>
      </div>
    </div>
  );
}
