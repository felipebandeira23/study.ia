import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStudyPlan } from "@/lib/ai/gemini";

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
    const { topic, durationDays, level } = body as {
      topic?: string;
      durationDays?: number;
      level?: "iniciante" | "intermediário" | "avançado";
    };

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "O campo 'topic' é obrigatório" },
        { status: 400 }
      );
    }

    const days = Math.min(Math.max(durationDays ?? 30, 1), 365);
    const studyLevel = level ?? "iniciante";

    const validLevels = ["iniciante", "intermediário", "avançado"];
    if (!validLevels.includes(studyLevel)) {
      return NextResponse.json(
        { error: "Nível inválido. Use: iniciante, intermediário ou avançado" },
        { status: 400 }
      );
    }

    const plan = await generateStudyPlan(topic, days, studyLevel);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error generating study plan:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar plano de estudo" },
      { status: 500 }
    );
  }
}
