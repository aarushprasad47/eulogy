"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

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

  function updateIds(newIds: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (newIds.length > 0) {
      params.set("ids", newIds.join(","));
    } else {
      params.delete("ids");
    }
    router.push(`/compare?${params.toString()}`);
  }

  function add(id: string) {
    if (selectedIds.includes(id) || selectedIds.length >= 4) return;
    updateIds([...selectedIds, id]);
  }

  function remove(id: string) {
    updateIds(selectedIds.filter((i) => i !== id));
  }

  const unselected = allHomes.filter((h) => !selectedIds.includes(h.id));
  const selected = allHomes.filter((h) => selectedIds.includes(h.id));

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Selected chips */}
      {selected.map((h) => (
        <div
          key={h.id}
          className="flex items-center gap-1.5 rounded-full bg-stone-800 px-3 py-1.5 text-sm text-white"
        >
          <span>{h.name}</span>
          <button onClick={() => remove(h.id)} className="ml-0.5 opacity-70 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {/* Add dropdown */}
      {selectedIds.length < 4 && unselected.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) {
              add(e.target.value);
              e.target.value = "";
            }
          }}
          className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300"
        >
          <option value="">+ Add funeral home</option>
          {unselected.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} — {h.city}, {h.state}
            </option>
          ))}
        </select>
      )}

      {selectedIds.length >= 4 && (
        <span className="text-xs text-stone-400">Max 4 homes</span>
      )}
    </div>
  );
}
