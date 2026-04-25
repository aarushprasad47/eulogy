import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import ChatBot from "@/components/ChatBot";
import { Flower2 } from "lucide-react";

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

        <footer className="border-t mt-16" style={{ borderColor: "var(--border)", background: "white" }}>
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2" style={{ color: "var(--taupe)" }}>
                <Flower2 className="h-4 w-4" />
                <span className="font-medium" style={{ fontFamily: "Lora, Georgia, serif" }}>Eulogy</span>
              </div>
              <p className="text-sm max-w-md" style={{ color: "var(--muted)" }}>
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
