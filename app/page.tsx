import Link from "next/link";
import { Search, Shield, DollarSign, Mail } from "lucide-react";
import SearchResults from "./SearchResults";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-stone-400">
            Funeral Price Transparency
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl">
            You deserve honest pricing
            <br />
            <span className="text-stone-500">during an impossible time.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-500 leading-relaxed">
            Funeral homes are legally required to share their prices. Eulogy compiles those
            prices so your family can compare, plan, and save — without the pressure.
          </p>

          <SearchBar />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-400">
            <span>Try: &ldquo;Seattle&rdquo;</span>
            <span>·</span>
            <span>&ldquo;98101&rdquo;</span>
            <span>·</span>
            <span>&ldquo;direct cremation&rdquo;</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-stone-400">
          How we collect prices
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Self-Reported"
            desc="Funeral homes that list their prices directly on Eulogy. The most accurate and up-to-date."
            color="bg-emerald-50 text-emerald-700"
          />
          <FeatureCard
            icon={<Search className="h-6 w-6" />}
            title="Web-Scraped"
            desc="Our system scans funeral home websites for publicly posted pricing information."
            color="bg-blue-50 text-blue-700"
          />
          <FeatureCard
            icon={<Mail className="h-6 w-6" />}
            title="GPL Request"
            desc="We email funeral homes requesting their General Price List, as allowed by the FTC Funeral Rule."
            color="bg-violet-50 text-violet-700"
          />
        </div>
      </section>

      {/* Rights callout */}
      <section className="border-y border-amber-200 bg-amber-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-4">
            <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">Know your rights under the FTC Funeral Rule</h3>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                <li>• Funeral homes <strong>must give you a price list</strong> when you visit or ask</li>
                <li>• You can <strong>decline any service</strong> you don&apos;t want</li>
                <li>• You can <strong>provide your own casket</strong> — they must accept it</li>
                <li>• <strong>Embalming is not legally required</strong> in most cases</li>
                <li>• You must receive an <strong>itemized statement</strong> before payment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Results or default listings */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <SearchResults searchParams={searchParams} />
      </section>
    </div>
  );
}

function SearchBar() {
  return (
    <form action="/" method="GET" className="mt-8 flex gap-2">
      <input
        type="text"
        name="q"
        placeholder="City, ZIP code, or funeral home name..."
        className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
      />
      <button
        type="submit"
        className="rounded-xl bg-stone-800 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-stone-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className={`inline-flex rounded-xl p-2.5 ${color}`}>{icon}</div>
      <h3 className="mt-3 font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-500 leading-relaxed">{desc}</p>
    </div>
  );
}
