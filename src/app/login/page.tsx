import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-10 flex items-center gap-2" aria-label="Grindstone home">
        <Mark />
        <span className="font-display text-xl font-semibold">Grindstone</span>
      </Link>
      <LoginForm />
    </main>
  );
}
