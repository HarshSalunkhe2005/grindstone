import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: { default: "Grindstone: placement prep, sharpened", template: "%s · Grindstone" },
  description:
    "A DSA roadmap that adapts to you: a daily plan, spaced revision, weak-topic detection, streaks and live LeetCode, Codeforces and GitHub stats.",
};

export const viewport: Viewport = { themeColor: "#080a0e", colorScheme: "dark" };

// Rendering on request lets Next stamp the per-request CSP nonce onto its own scripts (see proxy.ts).
export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
