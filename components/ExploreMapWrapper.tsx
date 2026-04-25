"use client";

import dynamic from "next/dynamic";
import type { MapHome } from "./ExploreMap";

const ExploreMap = dynamic(() => import("./ExploreMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full items-center justify-center text-sm"
      style={{ color: "var(--muted)" }}
    >
      Loading map…
    </div>
  ),
});

export default function ExploreMapWrapper({ homes }: { homes: MapHome[] }) {
  return <ExploreMap homes={homes} />;
}
