import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards } from "@/lib/ai/gemini";

function buildDeckTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return "Deck de estudos";
  const trimmed = normalized.length > 60 ? `${normalized.slice(0, 57)}...` : normalized;
  return `Deck: ${trimmed}`;
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
    const { content, count } = body as { content?: string; count?: number };

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

    const cardCount = Math.min(Math.max(count ?? 10, 1), 50);
    const flashcards = await generateFlashcards(content, cardCount);

    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .insert({
        user_id: user.id,
        title: buildDeckTitle(content),
        topic: content.slice(0, 120),
      })
      .select("id, title")
      .single();

    if (deckError) {
      console.error("Error creating deck:", deckError);
      return NextResponse.json(
        { error: "Flashcards gerados, mas não foi possível salvar o deck" },
        { status: 500 }
      );
    }

    const rows = flashcards.map((card) => ({
      deck_id: deck.id,
      user_id: user.id,
      front: card.front,
      back: card.back,
    }));

    if (rows.length > 0) {
      const { error: cardsError } = await supabase.from("flashcards").insert(rows);
      if (cardsError) {
        console.error("Error saving flashcards:", cardsError);
        return NextResponse.json(
          { error: "Deck criado, mas não foi possível salvar os flashcards" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ flashcards, deck, saved: true });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar flashcards" },
      { status: 500 }
    );
  }
}
