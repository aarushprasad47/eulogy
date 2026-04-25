import Link from "next/link";
import { Flower2 } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-800">
          <Flower2 className="h-5 w-5 text-stone-600" />
          <span className="text-lg tracking-tight">Eulogy</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm text-stone-600">
          <Link href="/compare" className="hover:text-stone-900 transition-colors">
            Compare
          </Link>
          <Link href="/chat" className="hover:text-stone-900 transition-colors">
            Ask AI
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-stone-800 px-4 py-1.5 text-white transition-colors hover:bg-stone-700"
          >
            List Your Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
