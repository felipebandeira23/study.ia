import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStudyPlan, StudyPlanContext } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { topic, durationDays, level, contestContext } = body as {
      topic?: string;
      durationDays?: number;
      level?: "iniciante" | "intermediário" | "avançado";
      contestContext?: StudyPlanContext;
    };

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "O campo 'topic' é obrigatório" },
        { status: 400 }
      );
    }

    const days = Math.min(Math.max(durationDays ?? 30, 1), 365);
    const studyLevel = level ?? "iniciante";
    const context = contestContext ?? {};
    const examDate =
      context.examDate && /^\d{4}-\d{2}-\d{2}$/.test(context.examDate)
        ? context.examDate
        : null;

    const validLevels = ["iniciante", "intermediário", "avançado"];
    if (!validLevels.includes(studyLevel)) {
      return NextResponse.json(
        { error: "Nível inválido. Use: iniciante, intermediário ou avançado" },
        { status: 400 }
      );
    }

    const plan = await generateStudyPlan(topic, days, studyLevel, context);

    const { data: studyPlan, error: insertError } = await supabase
      .from("study_plans")
      .insert({
        user_id: user.id,
        topic: topic.trim(),
        duration_days: days,
        level: studyLevel,
        plan_content: plan,
        contest_name: context.contestName?.trim() || null,
        contest_organizer: context.organizer?.trim() || null,
        contest_exam_date: examDate,
        contest_edital_text: context.editalText?.trim() || null,
        contest_notes: context.notes?.trim() || null,
        previous_exams_notes: context.previousExamsNotes?.trim() || null,
      })
      .select("id, topic")
      .single();

    if (insertError) {
      console.error("Error saving study plan:", insertError);
      return NextResponse.json(
        { error: "Plano gerado, mas não foi possível salvar no histórico" },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan, studyPlan, saved: true });
  } catch (error) {
    console.error("Error generating study plan:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar plano de estudo" },
      { status: 500 }
    );
  }
}
