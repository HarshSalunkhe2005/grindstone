import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-10 text-lg font-bold tracking-tight">
        Grind<span className="text-spark">stone</span>
      </Link>
      <LoginForm />
    </main>
  );
}
