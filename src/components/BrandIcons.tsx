import React from "react";
import {
  AirVent,
  Car,
  Coffee,
  Compass,
  Flame,
  MapPin,
  ParkingCircle,
  ShieldCheck,
  Sparkles,
  Sun,
  Utensils,
  Waves,
  Wifi,
} from "lucide-react";

export function HospitalityIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M6 27V15C6 10.5 11.5 8 16 4C20.5 8 26 10.5 26 15V27" stroke="#F2B705" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 27V18C11 15 13.5 13.5 16 11.5C18.5 13.5 21 15 21 18V27" stroke="#1F40C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 27H28" stroke="#F2B705" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function DiscoveryIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="#F2B705" strokeWidth="2.1" />
      <path d="M16 3V6M16 26V29M3 16H6M26 16H29" stroke="#F2B705" strokeWidth="2.1" strokeLinecap="round" />
      <polygon points="16,9 19,16 16,23 13,16" stroke="#1F40C5" strokeWidth="2" fill="rgba(242,183,5,0.25)" strokeLinejoin="round" />
    </svg>
  );
}

export function ReliabilityIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3.5L26 7.5V15.2C26 21.6 21.8 26.8 16 28.5C10.2 26.8 6 21.6 6 15.2V7.5L16 3.5Z" stroke="#F2B705" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M11.5 16.2L14.7 19.4L21 13" stroke="#1F40C5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GlobalIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="#F2B705" strokeWidth="2.1" />
      <ellipse cx="16" cy="16" rx="5.2" ry="11" stroke="#1F40C5" strokeWidth="1.8" />
      <path d="M5.5 12.5H26.5M5.5 19.5H26.5" stroke="#F2B705" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Tailored Moroccan category icon for every listing archetype */
export function CategoryIcon({ category, size = 14 }: { category?: string; size?: number }) {
  const c = (category || "").toLowerCase();
  if (c === "car") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 13l2-5.5A2 2 0 016.9 6h10.2a2 2 0 011.9 1.5L21 13v5a1 1 0 01-1 1h-1.5a1 1 0 01-1-1v-1h-11v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <circle cx="7.5" cy="13.5" r="1.2" fill="#F2B705" />
        <circle cx="16.5" cy="13.5" r="1.2" fill="#F2B705" />
      </svg>
    );
  }
  if (c === "restaurant" || c === "food") {
    // Traditional Moroccan Tajine silhouette
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 16h16l-1.5 3.5a1 1 0 01-.9.5H6.4a1 1 0 01-.9-.5L4 16z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M5 16c1.5-4.5 5-8 7-11 2 3 5.5 6.5 7 11" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <circle cx="12" cy="4.2" r="1.1" fill="#F2B705" />
      </svg>
    );
  }
  if (c === "experience" || c === "exp") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" />
        <polygon points="15.5,8.5 13.4,13.4 8.5,15.5 10.6,10.6" fill="#F2B705" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (c === "riad") {
    // Moroccan horseshoe arch + courtyard fountain
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 21V11.5C4 7.8 8 5.5 12 3c4 2.5 8 4.8 8 8.5V21" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M9 21v-6a3 3 0 016 0v6" stroke="#F2B705" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M3 21h18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }
  if (c === "villa") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 11l9-6 9 6v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M2 20c2.5-1.2 4.5-1.2 7 0s4.5 1.2 7 0 4.5-1.2 6 0" stroke="#F2B705" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (c === "apartment" || c === "guesthouse") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.9" />
        <path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-5h4v5" stroke="#F2B705" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (c === "resort") {
    // Moroccan oasis resort: Moorish pavilion + palm + lagoon wave
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 18V10.5L12 5l8 5.5V18" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M9.5 18v-4.2a2.5 2.5 0 015 0V18" stroke="#F2B705" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M2.5 20.5c2-1 3.8-1 5.8 0s3.8 1 5.8 0 3.8-1 5.8 0" stroke="#F2B705" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M12 2.5v2.5" stroke="#F2B705" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  // hotel
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 21V6a2 2 0 012-2h12a2 2 0 012 2v15" stroke="currentColor" strokeWidth="1.9" />
      <path d="M2 21h20M8 8h2M14 8h2M8 12h2M14 12h2M10 21v-4h4v4" stroke="#F2B705" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Smart Amenity Icon matching listing features across stays, cars, food & experiences */
export function AmenityIcon({ label, size = 13 }: { label: string; size?: number }) {
  const s = label.toLowerCase();
  if (s.includes("wifi") || s.includes("wi-fi")) return <Wifi size={size} style={{ color: "var(--primary)" }} />;
  if (s.includes("déj") || s.includes("breakfast") || s.includes("brunch") || s.includes("thé") || s.includes("pâtisserie"))
    return <Coffee size={size} style={{ color: "var(--gold)" }} />;
  if (s.includes("piscine") || s.includes("pool") || s.includes("mer") || s.includes("plage") || s.includes("surf") || s.includes("kite") || s.includes("océan"))
    return <Waves size={size} style={{ color: "var(--primary)" }} />;
  if (s.includes("clim") || s.includes("a/c")) return <AirVent size={size} style={{ color: "var(--primary)" }} />;
  if (s.includes("parking")) return <ParkingCircle size={size} style={{ color: "var(--primary)" }} />;
  if (s.includes("automatique") || s.includes("manuelle") || s.includes("diesel") || s.includes("essence") || s.includes("électrique") || s.includes("livraison") || s.includes("4x4"))
    return <Car size={size} style={{ color: "var(--primary)" }} />;
  if (s.includes("tajine") || s.includes("grill") || s.includes("pastilla") || s.includes("couscous") || s.includes("poisson") || s.includes("fruits de mer") || s.includes("viande") || s.includes("dîner"))
    return <Utensils size={size} style={{ color: "var(--gold)" }} />;
  if (s.includes("désert") || s.includes("dunes") || s.includes("sahara") || s.includes("soleil"))
    return <Sun size={size} style={{ color: "var(--gold)" }} />;
  if (s.includes("spa") || s.includes("hammam") || s.includes("détente") || s.includes("traditionnel"))
    return <Sparkles size={size} style={{ color: "var(--gold)" }} />;
  if (s.includes("guide") || s.includes("cours") || s.includes("atelier"))
    return <Compass size={size} style={{ color: "var(--primary)" }} />;
  if (s.includes("centre") || s.includes("terrasse") || s.includes("patio") || s.includes("vue"))
    return <MapPin size={size} style={{ color: "var(--primary)" }} />;
  if (s.includes("nuit") || s.includes("famille") || s.includes("moderne"))
    return <Flame size={size} style={{ color: "var(--gold)" }} />;
  return <ShieldCheck size={size} style={{ color: "var(--success)" }} />;
}
