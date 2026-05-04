import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Erro de autenticação — StudyAI",
};

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Erro de autenticação
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Ocorreu um erro ao tentar autenticar. Por favor, tente novamente.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
