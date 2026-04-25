"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/utils";

interface ServiceRow {
  category: string;
  name: string;
  price: string;
  priceMin: string;
  priceMax: string;
  isRange: boolean;
}

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    website: "",
  });

  const [services, setServices] = useState<ServiceRow[]>([
    { category: "DIRECT_CREMATION", name: "Direct Cremation", price: "", priceMin: "", priceMax: "", isRange: false },
    { category: "BASIC_SERVICES", name: "Basic Services Fee", price: "", priceMin: "", priceMax: "", isRange: false },
  ]);

  function updateField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateService(idx: number, key: keyof ServiceRow, value: string | boolean) {
    setServices((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  }

  function addService() {
    setServices((prev) => [
      ...prev,
      { category: "OTHER", name: "", price: "", priceMin: "", priceMax: "", isRange: false },
    ]);
  }

  function removeService(idx: number) {
    setServices((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        services: services
          .filter((s) => s.name && (s.price || s.priceMin))
          .map((s) => ({
            category: s.category,
            name: s.name,
            price: s.isRange ? null : s.price ? parseFloat(s.price) : null,
            priceMin: s.isRange && s.priceMin ? parseFloat(s.priceMin) : null,
            priceMax: s.isRange && s.priceMax ? parseFloat(s.priceMax) : null,
          })),
      };

      const res = await fetch("/api/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Submission failed");

      const data = await res.json();
      router.push(`/homes/${data.id}?registered=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Business info */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-stone-900">Business Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Funeral Home Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-stone-700">Address *</label>
            <input
              required
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">City *</label>
            <input
              required
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">State *</label>
              <input
                required
                maxLength={2}
                placeholder="WA"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">ZIP *</label>
              <input
                required
                value={form.zip}
                onChange={(e) => updateField("zip", e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-stone-700">Website</label>
            <input
              type="url"
              placeholder="https://"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-stone-900">Services & Prices</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Enter the prices from your General Price List (GPL)
            </p>
          </div>
          <button
            type="button"
            onClick={addService}
            className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add service
          </button>
        </div>

        <div className="space-y-3">
          {services.map((s, i) => (
            <div key={i} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Category</label>
                  <select
                    value={s.category}
                    onChange={(e) => updateService(i, "category", e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-stone-600">Service Name</label>
                  <input
                    value={s.name}
                    onChange={(e) => updateService(i, "name", e.target.value)}
                    placeholder="e.g. Direct Cremation (no viewing)"
                    className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-stone-600">
                  <input
                    type="checkbox"
                    checked={s.isRange}
                    onChange={(e) => updateService(i, "isRange", e.target.checked)}
                    className="rounded"
                  />
                  Price range
                </label>

                {s.isRange ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="number"
                      value={s.priceMin}
                      onChange={(e) => updateService(i, "priceMin", e.target.value)}
                      placeholder="Min $"
                      className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
                    />
                    <input
                      type="number"
                      value={s.priceMax}
                      onChange={(e) => updateService(i, "priceMax", e.target.value)}
                      placeholder="Max $"
                      className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    value={s.price}
                    onChange={(e) => updateService(i, "price", e.target.value)}
                    placeholder="Price $"
                    className="w-40 rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeService(i)}
                  className="ml-auto text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-stone-800 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Submitting..." : "Submit Prices"}
      </button>

      <p className="text-center text-xs text-stone-400">
        By submitting, you confirm these prices are accurate as of today. Eulogy reserves the right
        to verify and display this information publicly.
      </p>
    </form>
  );
}
