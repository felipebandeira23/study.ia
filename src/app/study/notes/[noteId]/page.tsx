import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resumo Salvo — StudyAI",
  description: "Visualize um resumo salvo",
};

type NoteDetailPageProps = {
  params: Promise<{ noteId: string }>;
};

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { noteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: note } = await supabase
    .from("study_notes")
    .select("id, title, content, summary, created_at")
    .eq("id", noteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!note) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Resumo não encontrado</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Este resumo não existe ou não pertence à sua conta.
          </p>
          <Link
            href="/study/notes"
            className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Voltar para resumos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{note.title}</h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Criado em {new Date(note.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
          <Link
            href="/study/notes"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Voltar para lista
          </Link>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Resumo</h2>
          <div className="prose prose-zinc mt-3 max-w-none whitespace-pre-wrap text-sm dark:prose-invert">
            {note.summary ?? "Sem resumo salvo."}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Conteúdo original</h2>
          <div className="prose prose-zinc mt-3 max-w-none whitespace-pre-wrap text-sm dark:prose-invert">
            {note.content}
          </div>
        </section>
      </div>
    </div>
  );
}
