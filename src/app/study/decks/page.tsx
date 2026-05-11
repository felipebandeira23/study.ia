import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Decks Salvos — StudyAI",
  description: "Gerencie seus decks salvos",
};

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
}

export default async function SavedDecksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">🗂️ Decks salvos</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Abra, revise, renomeie e exclua seus decks.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/study/flashcards"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Criar deck
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
          {!decks || decks.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Você ainda não possui decks salvos.</p>
          ) : (
            <ul className="space-y-3">
              {decks.map((deck) => (
                <li
                  key={deck.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {deck.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(deck.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/study/review/${deck.id}`}
                      className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Revisar
                    </Link>
                    <Link
                      href={`/study/decks/${deck.id}`}
                      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Gerenciar
                    </Link>
                    <form action={deleteDeckAction}>
                      <input type="hidden" name="deckId" value={deck.id} />
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
