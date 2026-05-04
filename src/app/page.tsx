import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="flex flex-col items-center gap-12 py-24 px-8 text-center max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900 px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300">
            Powered by Google AI Studio
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Estude mais inteligente com{" "}
            <span className="text-blue-600 dark:text-blue-400">StudyAI</span>
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Transforme qualquer conteúdo em resumos, flashcards e planos de
            estudo personalizados com o poder da inteligência artificial.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Começar gratuitamente
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 px-8 text-base font-semibold text-zinc-900 dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Fazer login
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-left">
            <span className="text-3xl">📝</span>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Resumos Inteligentes
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Cole qualquer texto ou descreva um tema e receba um resumo de estudo
              completo e organizado em segundos.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-left">
            <span className="text-3xl">🗂️</span>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Flashcards Automáticos
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Gere decks de flashcards do seu conteúdo de forma automática e
              memorize com eficiência.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-left">
            <span className="text-3xl">📅</span>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Planos de Estudo
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Receba um plano de estudos personalizado para qualquer tema,
              adaptado ao seu nível e tempo disponível.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
