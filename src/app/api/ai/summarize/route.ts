import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStudySummary } from "@/lib/ai/gemini";

function buildNoteTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return "Resumo de estudo";
  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
}

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
    const { content } = body as { content?: string };

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "O campo 'content' é obrigatório" },
        { status: 400 }
      );
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: "O conteúdo é muito longo (máximo 50.000 caracteres)" },
        { status: 400 }
      );
    }

    const summary = await generateStudySummary(content);

    const title = buildNoteTitle(content);
    const { data: note, error: insertError } = await supabase
      .from("study_notes")
      .insert({
        user_id: user.id,
        title,
        content,
        summary,
      })
      .select("id, title")
      .single();

    if (insertError) {
      console.error("Error saving summary note:", insertError);
      return NextResponse.json(
        { error: "Resumo gerado, mas não foi possível salvar no histórico" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary, note, saved: true });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar resumo" },
      { status: 500 }
    );
  }
}
