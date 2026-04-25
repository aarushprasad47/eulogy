import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "Call for pricing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export const SERVICE_CATEGORIES = [
  { key: "BASIC_SERVICES", label: "Basic Services Fee" },
  { key: "DIRECT_CREMATION", label: "Direct Cremation" },
  { key: "IMMEDIATE_BURIAL", label: "Immediate Burial" },
  { key: "FORWARDING_REMAINS", label: "Forwarding Remains" },
  { key: "RECEIVING_REMAINS", label: "Receiving Remains" },
  { key: "FULL_FUNERAL_SERVICE", label: "Full Funeral Service" },
  { key: "GRAVESIDE_SERVICE", label: "Graveside Service" },
  { key: "TRANSFER_OF_REMAINS", label: "Transfer of Remains" },
  { key: "EMBALMING", label: "Embalming" },
  { key: "BODY_PREPARATION", label: "Other Body Preparation" },
  { key: "VIEWING_FACILITIES", label: "Facilities for Viewing" },
  { key: "FUNERAL_CEREMONY_FACILITIES", label: "Facilities for Funeral Ceremony" },
  { key: "GRAVESIDE_FACILITIES", label: "Facilities for Graveside Service" },
  { key: "HEARSE", label: "Hearse" },
  { key: "LIMOUSINE", label: "Limousine / Family Car" },
  { key: "CASKET", label: "Caskets" },
  { key: "OUTER_BURIAL_CONTAINER", label: "Outer Burial Containers" },
  { key: "URN", label: "Urns" },
  { key: "MONUMENT", label: "Monuments & Markers" },
  { key: "OTHER", label: "Other Services" },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["key"];
