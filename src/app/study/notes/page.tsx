import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resumos Salvos — StudyAI",
  description: "Gerencie seus resumos salvos",
};

async function deleteNoteAction(formData: FormData) {
  "use server";

  const noteId = formData.get("noteId");
  if (!noteId || typeof noteId !== "string") {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  await supabase.from("study_notes").delete().eq("id", noteId).eq("user_id", user.id);

  revalidatePath("/study/notes");
  revalidatePath("/dashboard");
}

export default async function SavedNotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: notes } = await supabase
    .from("study_notes")
    .select("id, title, summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">📝 Resumos salvos</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Consulte e gerencie seus resumos gerados.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/study/summarize"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Gerar resumo
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
          {!notes || notes.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Você ainda não possui resumos salvos.
            </p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {note.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {note.summary ?? "Resumo sem conteúdo."}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(note.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/study/notes/${note.id}`}
                      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Abrir
                    </Link>
                    <form action={deleteNoteAction}>
                      <input type="hidden" name="noteId" value={note.id} />
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
