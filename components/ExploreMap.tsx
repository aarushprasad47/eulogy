"use client";

import { useEffect, useRef } from "react";

interface Service {
  id: string;
  name: string;
  category: string;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
}

export interface MapHome {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  services: Service[];
}

function fmt(s: Service): string {
  if (s.price != null) return `$${s.price.toLocaleString()}`;
  if (s.priceMin != null) return `$${s.priceMin.toLocaleString()}–$${s.priceMax?.toLocaleString()}`;
  return "Call";
}

// Priority categories to show in popup
const PRIORITY = [
  "DIRECT_CREMATION",
  "BASIC_SERVICES",
  "FULL_FUNERAL_SERVICE",
  "IMMEDIATE_BURIAL",
  "EMBALMING",
];

function buildPopup(home: MapHome): string {
  const prioritized = PRIORITY.map((cat) =>
    home.services.find((s) => s.category === cat)
  ).filter(Boolean) as Service[];

  const rows = (prioritized.length > 0 ? prioritized : home.services.slice(0, 4))
    .slice(0, 4)
    .map(
      (s) =>
        `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:4px 0;border-bottom:1px solid #EEF2F8;">
          <span style="font-size:12px;color:#6B85A0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;">${s.name}</span>
          <span style="font-size:12px;font-weight:600;color:#4472A8;white-space:nowrap;">${fmt(s)}</span>
        </div>`
    )
    .join("");

  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:220px;max-width:260px;">
      <div style="margin-bottom:8px;">
        <a href="/homes/${home.id}"
           style="font-size:15px;font-weight:700;color:#4472A8;text-decoration:none;line-height:1.3;display:block;">
          ${home.name}
        </a>
        <span style="font-size:11px;color:#8FA3B8;">
          ${home.address}, ${home.city}, ${home.state}
        </span>
      </div>
      ${rows ? `<div style="margin-bottom:10px;">${rows}</div>` : ""}
      <a href="/homes/${home.id}"
         style="display:inline-block;font-size:11px;font-weight:600;color:#4472A8;text-decoration:none;border:1.5px solid #D8E4EF;border-radius:999px;padding:4px 12px;">
        View all prices →
      </a>
    </div>`;
}

export default function ExploreMap({ homes }: { homes: MapHome[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Inject Leaflet CSS from CDN
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Inject custom pin + popup CSS
    if (!document.getElementById("eulogy-map-css")) {
      const style = document.createElement("style");
      style.id = "eulogy-map-css";
      style.textContent = `
        .eulogy-pin { cursor: pointer; transition: transform 0.15s ease; }
        .eulogy-pin:hover { transform: scale(1.15) translateY(-2px); }
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 8px 32px -4px rgba(68,114,168,0.18) !important;
          border: 1px solid #D8E4EF;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 14px 16px !important;
        }
        .leaflet-popup-tip { background: white !important; }
        .leaflet-popup-close-button {
          color: #8FA3B8 !important;
          font-size: 18px !important;
          right: 8px !important;
          top: 6px !important;
        }
        .leaflet-tile-pane { filter: saturate(0.6) brightness(1.05); }
      `;
      document.head.appendChild(style);
    }

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [34.02, -118.28],
        zoom: 11,
        zoomControl: false,
      });
      mapRef.current = map;

      // Zoom control bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OSM tiles (desaturated via CSS above for softer look)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom teardrop pin matching site navy
      const pin = L.divIcon({
        html: `<div class="eulogy-pin">
          <svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 44 16 44S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#4472A8"/>
            <circle cx="16" cy="16" r="7" fill="white"/>
          </svg>
        </div>`,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -46],
        className: "",
      });

      homes.forEach((home) => {
        L.marker([home.lat, home.lng], { icon: pin })
          .addTo(map)
          .bindPopup(buildPopup(home), {
            maxWidth: 280,
            autoPanPadding: [30, 30],
          })
          .on("mouseover", function (this: L.Marker) {
            this.openPopup();
          });
      });
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove(): void }).remove();
        mapRef.current = null;
      }
    };
  }, [homes]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
