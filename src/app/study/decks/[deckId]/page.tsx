import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deck Salvo — StudyAI",
  description: "Visualize e gerencie um deck salvo",
};

type DeckDetailPageProps = {
  params: Promise<{ deckId: string }>;
};

async function renameDeckAction(formData: FormData) {
  "use server";

  const deckId = formData.get("deckId");
  const title = formData.get("title");

  if (!deckId || typeof deckId !== "string" || !title || typeof title !== "string") {
    return;
  }

  const nextTitle = title.trim();
  if (nextTitle.length === 0) {
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
    .from("decks")
    .update({ title: nextTitle.slice(0, 120) })
    .eq("id", deckId)
    .eq("user_id", user.id);

  revalidatePath(`/study/decks/${deckId}`);
  revalidatePath("/study/decks");
  revalidatePath("/dashboard");
}

async function deleteDeckAction(formData: FormData) {
  "use server";

  const deckId = formData.get("deckId");
  if (!deckId || typeof deckId !== "string") {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  await supabase.from("decks").delete().eq("id", deckId).eq("user_id", user.id);

  revalidatePath("/study/decks");
  revalidatePath("/dashboard");
  redirect("/study/decks");
}

export default async function DeckDetailPage({ params }: DeckDetailPageProps) {
  const { deckId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, created_at")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!deck) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Deck não encontrado</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Este deck não existe ou não pertence à sua conta.
          </p>
          <Link
            href="/study/decks"
            className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Voltar para decks
          </Link>
        </div>
      </div>
    );
  }

  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("id, front, back")
    .eq("deck_id", deck.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{deck.title}</h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Criado em {new Date(deck.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/study/review/${deck.id}`}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Revisar deck
            </Link>
            <Link
              href="/study/decks"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Voltar para lista
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Renomear deck</h2>
          <form action={renameDeckAction} className="mt-4 flex flex-wrap items-center gap-3">
            <input type="hidden" name="deckId" value={deck.id} />
            <input
              type="text"
              name="title"
              defaultValue={deck.title}
              required
              maxLength={120}
              className="min-w-60 flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button
              type="submit"
              className="rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              Salvar nome
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Flashcards ({flashcards?.length ?? 0})
            </h2>
          </div>

          {!flashcards || flashcards.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Este deck não possui flashcards.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {flashcards.map((card, index) => (
                <li
                  key={card.id}
                  className="rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800"
                >
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {index + 1}. {card.front}
                  </p>
                  <p className="mt-2 text-zinc-700 dark:text-zinc-300">{card.back}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/10">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Excluir deck</h2>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300">
            Essa ação remove o deck e seus flashcards salvos.
          </p>
          <form action={deleteDeckAction} className="mt-4">
            <input type="hidden" name="deckId" value={deck.id} />
            <button
              type="submit"
              className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Excluir deck
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
