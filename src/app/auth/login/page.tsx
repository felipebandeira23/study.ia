import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login — StudyAI",
  description: "Faça login na sua conta StudyAI",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Entrar no{" "}
            <span className="text-blue-600 dark:text-blue-400">StudyAI</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Não tem uma conta?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
