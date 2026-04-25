import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import ChatBot from "@/components/ChatBot";

export const metadata: Metadata = {
  title: "Eulogy — Funeral Price Transparency",
  description: "Compare funeral home prices in your area. Know your rights. Make informed decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200 bg-white py-8 text-center text-xs text-stone-400">
          <p>Eulogy — Helping families understand funeral costs since 2024.</p>
          <p className="mt-1">
            Funeral homes are legally required to provide a General Price List upon request (FTC Funeral Rule).
          </p>
        </footer>
        <ChatBot />
      </body>
    </html>
  );
}
