import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Chat",
  description: "A simple streaming AI chat app built with Next.js + Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white flex flex-col">
        <header className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 via-sky-400 to-emerald-400" />
              AI Chat
            </Link>

            <nav className="flex items-center gap-1 text-sm text-zinc-200">
              <Link href="/" className="rounded-lg px-3 py-2 hover:bg-white/5">
                Chat
              </Link>
              <Link
                href="/prompts"
                className="rounded-lg px-3 py-2 hover:bg-white/5"
              >
                Prompts
              </Link>
              <Link
                href="/about"
                className="rounded-lg px-3 py-2 hover:bg-white/5"
              >
                About
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-white/5">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-5 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Built with Next.js + Gemini</p>
            <div className="flex items-center gap-4">
              <a
                className="hover:text-zinc-200"
                href="https://ai.google.dev/"
                target="_blank"
                rel="noreferrer"
              >
                Gemini Docs
              </a>
              <a
                className="hover:text-zinc-200"
                href="https://nextjs.org/"
                target="_blank"
                rel="noreferrer"
              >
                Next.js
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
