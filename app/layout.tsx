import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import ChatBot from "@/components/ChatBot";

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
              <div
                className="flex items-center gap-2.5"
                style={{ color: "var(--navy)" }}
              >
                {/* Dove mark */}
                <svg width="20" height="17" viewBox="0 0 26 22" fill="currentColor" opacity={0.7}>
                  <path d="M13 9C10.5 6.5 6.5 5.5 4 7.5C1.5 9.5 2 13 5 14.5C7.5 15.8 10.5 14.5 13 12C15.5 14.5 18.5 15.8 21 14.5C24 13 24.5 9.5 22 7.5C19.5 5.5 15.5 6.5 13 9Z"/>
                  <path d="M13 9C13 6 16 3.5 19.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
                </svg>
                <span
                  className="text-base"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}
                >
                  Eulogy
                </span>
              </div>
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
