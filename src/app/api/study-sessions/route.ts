import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type UpdateStudySessionBody = {
  sessionId?: string;
  cardsReviewed?: number;
  correctAnswers?: number;
  finished?: boolean;
};

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateStudySessionBody;
    const { sessionId, cardsReviewed, correctAnswers, finished } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId é obrigatório" }, { status: 400 });
    }

    if (
      typeof cardsReviewed !== "number" ||
      Number.isNaN(cardsReviewed) ||
      cardsReviewed < 0
    ) {
      return NextResponse.json(
        { error: "cardsReviewed deve ser um número válido" },
        { status: 400 }
      );
    }

    if (
      typeof correctAnswers !== "number" ||
      Number.isNaN(correctAnswers) ||
      correctAnswers < 0
    ) {
      return NextResponse.json(
        { error: "correctAnswers deve ser um número válido" },
        { status: 400 }
      );
    }

    const payload: {
      cards_reviewed: number;
      correct_answers: number;
      finished_at?: string;
    } = {
      cards_reviewed: cardsReviewed,
      correct_answers: correctAnswers,
    };

    if (finished) {
      payload.finished_at = new Date().toISOString();
    }

    const { data: session, error } = await supabase
      .from("study_sessions")
      .update(payload)
      .eq("id", sessionId)
      .select("id, cards_reviewed, correct_answers, finished_at")
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: "Não foi possível atualizar a sessão de estudo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error updating study session:", error);
    return NextResponse.json({ error: "Erro interno ao salvar progresso" }, { status: 500 });
  }
}
