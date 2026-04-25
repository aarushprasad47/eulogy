import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import ChatBot from "@/components/ChatBot";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Eulogy — Funeral Price Transparency",
  description: "Compare funeral home prices in your area. Know your rights. Make informed decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>

        <footer
          className="border-t"
          style={{ borderColor: "var(--border)", background: "white" }}
        >
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <Image
                src="/logo.png"
                alt="Eulogy Funeral Services"
                width={120}
                height={44}
                className="h-10 w-auto opacity-75"
              />
              <p className="max-w-md text-sm" style={{ color: "var(--muted)" }}>
                Helping families make informed decisions during one of life&apos;s hardest moments.
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Under the FTC Funeral Rule, funeral homes are legally required to provide a General Price List upon request.
              </p>
            </div>
          </div>
        </footer>

        <ChatBot />
      </body>
    </html>
  );
}
