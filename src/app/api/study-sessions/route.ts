import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type UpdateStudySessionBody = {
  sessionId?: string;
  cardsReviewed?: number;
  correctAnswers?: number;
  finished?: boolean;
};

function isValidNonNegativeNumber(value: unknown) {
  return typeof value === "number" && !Number.isNaN(value) && value >= 0;
}

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

    if (!isValidNonNegativeNumber(cardsReviewed)) {
      return NextResponse.json(
        { error: "cardsReviewed deve ser um número válido" },
        { status: 400 }
      );
    }

    if (!isValidNonNegativeNumber(correctAnswers)) {
      return NextResponse.json(
        { error: "correctAnswers deve ser um número válido" },
        { status: 400 }
      );
    }

    const reviewedValue = Number(cardsReviewed);
    const correctValue = Number(correctAnswers);

    if (correctValue > reviewedValue) {
      return NextResponse.json(
        { error: "correctAnswers não pode ser maior que cardsReviewed" },
        { status: 400 }
      );
    }

    const payload: {
      cards_reviewed: number;
      correct_answers: number;
      finished_at?: string;
    } = {
      cards_reviewed: reviewedValue,
      correct_answers: correctValue,
    };

    if (finished) {
      payload.finished_at = new Date().toISOString();
    }

    const { data: session, error } = await supabase
      .from("study_sessions")
      .update(payload)
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select("id, cards_reviewed, correct_answers, finished_at")
      .single();

    if (error || !session) {
      const details =
        process.env.NODE_ENV === "development" ? error?.message ?? null : null;
      return NextResponse.json(
        { error: "Não foi possível atualizar a sessão de estudo", details },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error updating study session:", error);
    return NextResponse.json({ error: "Erro interno ao salvar progresso" }, { status: 500 });
  }
}
