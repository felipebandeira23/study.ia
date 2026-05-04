import { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cadastro — StudyAI",
  description: "Crie sua conta no StudyAI",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Criar conta no{" "}
            <span className="text-blue-600 dark:text-blue-400">StudyAI</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Já tem uma conta?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Faça login
            </Link>
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
