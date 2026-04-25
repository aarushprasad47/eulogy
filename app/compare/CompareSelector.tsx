"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";

interface Home {
  id: string;
  name: string;
  city: string;
  state: string;
}

export default function CompareSelector({
  allHomes,
  selectedIds,
}: {
  allHomes: Home[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function updateIds(newIds: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (newIds.length > 0) params.set("ids", newIds.join(","));
    else params.delete("ids");
    router.push(`/compare?${params.toString()}`);
  }

  function add(id: string) {
    if (selectedIds.includes(id) || selectedIds.length >= 4) return;
    updateIds([...selectedIds, id]);
    setQuery("");
    setOpen(false);
  }

  function remove(id: string) {
    updateIds(selectedIds.filter((i) => i !== id));
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const q = query.toLowerCase().trim();
  const suggestions = allHomes
    .filter((h) => !selectedIds.includes(h.id))
    .filter((h) =>
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.state.toLowerCase().includes(q)
    )
    .slice(0, 8);

  const selected = allHomes.filter((h) => selectedIds.includes(h.id));

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-1.5 rounded-full bg-stone-800 px-3 py-1.5 text-sm text-white"
            >
              <span>{h.name}</span>
              <span className="text-stone-400 text-xs">{h.city}, {h.state}</span>
              <button
                onClick={() => remove(h.id)}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      {selectedIds.length < 4 && (
        <div className="relative w-full max-w-md">
          <div className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-stone-400">
            <Search className="h-4 w-4 text-stone-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder={
                allHomes.length === 0
                  ? "No homes with price data yet"
                  : `Search ${allHomes.length} funeral homes by name or city…`
              }
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              disabled={allHomes.length === 0}
              className="flex-1 text-sm text-stone-800 outline-none placeholder:text-stone-400 disabled:cursor-not-allowed"
            />
            {query && (
              <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
                <X className="h-3.5 w-3.5 text-stone-400 hover:text-stone-600" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {open && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-10 mt-1 w-full rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden"
            >
              {suggestions.map((h) => (
                <button
                  key={h.id}
                  onMouseDown={() => add(h.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-stone-50 transition-colors"
                >
                  <span className="font-medium text-stone-800">{h.name}</span>
                  <span className="text-stone-400 text-xs ml-2 shrink-0">{h.city}, {h.state}</span>
                </button>
              ))}
            </div>
          )}

          {open && query && suggestions.length === 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-10 mt-1 w-full rounded-xl border border-stone-200 bg-white shadow-lg px-4 py-3 text-sm text-stone-400"
            >
              No matches for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}

      {selectedIds.length >= 4 && (
        <p className="text-xs text-stone-400">Max 4 homes selected. Remove one to add another.</p>
      )}
    </div>
  );
}
