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

        {/* Fixed flower — stays in place while everything scrolls */}
        <div className="fixed inset-0" style={{ zIndex: -1, pointerEvents: "none" }}>
          <Image
            src="/flower.png"
            alt=""
            fill
            className="object-cover object-center"
            style={{ opacity: 0.42 }}
            priority
          />
          {/* Soft radial vignette so edges blend with cream bg */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 85% 72% at 52% 42%, transparent 18%, rgba(238,242,248,0.48) 52%, rgba(238,242,248,0.80) 76%, rgba(238,242,248,0.97) 100%)",
            }}
          />
        </div>

        <Header />
        <main className="flex-1">{children}</main>

        <footer style={{ borderTop: "1px solid var(--border)", background: "rgba(244,247,251,0.92)", backdropFilter: "blur(8px)" }}>
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <Image
                src="/logo.png"
                alt="Eulogy Funeral Services"
                width={140}
                height={52}
                className="h-12 w-auto opacity-80"
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
