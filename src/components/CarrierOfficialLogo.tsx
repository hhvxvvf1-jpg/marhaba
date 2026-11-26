"use client";

import React from "react";
import { Bus, CarFront } from "lucide-react";
import type { AirlineCode } from "@/lib/flights-catalog";
import type { OfferCarrierType } from "@/lib/transport-offers";
import type { TelecomOperatorId } from "@/lib/services-catalog";

const AIRLINE_LOGO_MAP: Record<AirlineCode, { src: string; alt: string }> = {
  AT: { src: "/logos/ram.png", alt: "Royal Air Maroc" },
  "3O": { src: "/logos/airarabia.png", alt: "Air Arabia Maroc" },
  TO: { src: "/logos/transavia.png", alt: "Transavia" },
  FR: { src: "/logos/ryanair.png", alt: "Ryanair" },
  IB: { src: "/logos/iberia.png", alt: "Iberia" },
  VY: { src: "/logos/vueling.png", alt: "Vueling" },
  U2: { src: "/logos/easyjet.png", alt: "easyJet" },
  TB: { src: "/logos/tuifly.png", alt: "TUI fly" },
  AF: { src: "/logos/airfrance.png", alt: "Air France" },
  LH: { src: "/logos/lufthansa.png", alt: "Lufthansa" },
  TK: { src: "/logos/turkish.png", alt: "Turkish Airlines" },
  QR: { src: "/logos/qatar.png", alt: "Qatar Airways" },
  NT: { src: "/logos/binter.png", alt: "Binter Canarias" },
};

export function AirlineOfficialLogo({
  code,
  height = 28,
  compact = false,
}: {
  code: AirlineCode;
  height?: number;
  compact?: boolean;
}) {
  const logo = AIRLINE_LOGO_MAP[code];
  return (
    <span
      className="carrier-logo-pill"
      style={{
        height: compact ? 24 : Math.max(34, height + 10),
        padding: compact ? "3px 6px" : "4px 10px",
        borderRadius: compact ? 7 : 10,
      }}
      title={logo.alt}
    >
      <img
        src={logo.src}
        alt={logo.alt}
        style={{
          height: compact ? 16 : height,
          width: "auto",
          maxWidth: compact ? 52 : 92,
          objectFit: "contain",
          display: "block",
        }}
      />
    </span>
  );
}

export function resolveTransportLogo(
  carrierBrand: string,
  carrierType?: OfferCarrierType
): { src: string; alt: string } | null {
  const b = (carrierBrand || "").toLowerCase();
  if (b.includes("casa busway") || b.includes("busway")) {
    return { src: "/logos/casabusway.png", alt: "Casa Busway" };
  }
  if (b.includes("casabus")) {
    return { src: "/logos/casabus.png", alt: "Casabus by Alsa" };
  }
  if (b.includes("casa tram") || b.includes("casatram")) {
    return { src: "/logos/casatramway.png", alt: "Casa Tramway" };
  }
  if (b.includes("tramway rabat") || b.includes("rabat-salé") || b.includes("rabat tram")) {
    return { src: "/logos/rabattram.png", alt: "Tramway Rabat-Salé" };
  }
  if (b.includes("boraq")) return { src: "/logos/alboraq.png", alt: "ONCF Al Boraq" };
  if (b.includes("oncf") || b.includes("atlas") || b.includes("bidaoui") || b.includes("tnr") || carrierType === "train_oncf") {
    return { src: "/logos/oncf.png", alt: "ONCF" };
  }
  if (b.includes("supratours") || carrierType === "supratours") {
    return { src: "/logos/supratours.png", alt: "Supratours" };
  }
  if (b.includes("ctm") || carrierType === "bus_ctm") {
    return { src: "/logos/ctm.png", alt: "CTM" };
  }
  if (b.includes("alsa")) return { src: "/logos/alsa.png", alt: "ALSA" };
  if (b.includes("satas")) return { src: "/logos/satas.png", alt: "SATAS" };
  if (b.includes("nejme chamal") || b.includes("nejme")) return { src: "/logos/nejmechamal.png", alt: "Nejme Chamal" };
  if (b.includes("itrane")) return { src: "/logos/itrane.png", alt: "Itrane Voyage" };
  if (b.includes("globus")) return { src: "/logos/globus.png", alt: "Globus Trans" };
  if (b.includes("ghazala")) return { src: "/logos/ghazala.png", alt: "Trans Ghazala" };
  if (b.includes("bab salama") || b.includes("babsalama")) return { src: "/logos/babsalama.png", alt: "Bab Salama" };
  if (b.includes("yamama")) return { src: "/logos/yamama.png", alt: "Trans Al Yamama" };
  if (b.includes("sotram")) return { src: "/logos/sotram.png", alt: "Sotram" };
  if (b.includes("sat first") || b === "sat") return { src: "/logos/sat.png", alt: "SAT First" };
  if (b.includes("jaouharat") || b.includes("jaouharate")) return { src: "/logos/jaouharatagadir.png", alt: "Jaouharat Agadir" };
  if (b.includes("sahara prestige") || b.includes("sahara")) return { src: "/logos/saharaprestige.png", alt: "Sahara Prestige" };
  if (b.includes("star bus") || b.includes("stt")) return { src: "/logos/starbus.png", alt: "Star Bus STT" };
  if (b.includes("wissam")) return { src: "/logos/alwissam.png", alt: "Al Wissam Addahabi" };
  return null;
}

export function TransportOfficialLogo({
  carrierBrand,
  carrierType,
  height = 24,
  compact = false,
}: {
  carrierBrand: string;
  carrierType?: OfferCarrierType;
  height?: number;
  compact?: boolean;
}) {
  const logo = resolveTransportLogo(carrierBrand, carrierType);
  if (logo) {
    return (
      <span
        className="carrier-logo-pill"
        style={{
          height: compact ? 24 : Math.max(34, height + 10),
          padding: compact ? "3px 6px" : "4px 10px",
          borderRadius: compact ? 7 : 10,
        }}
        title={logo.alt}
      >
        <img
          src={logo.src}
          alt={logo.alt}
          style={{
            height: compact ? 16 : height,
            width: "auto",
            maxWidth: compact ? 54 : 92,
            objectFit: "contain",
            display: "block",
          }}
        />
      </span>
    );
  }

  if (carrierType === "taxi_transfer" || carrierBrand.toLowerCase().includes("marhaba")) {
    return (
      <span
        className="carrier-logo-pill"
        style={{
          height: compact ? 24 : Math.max(34, height + 10),
          padding: compact ? "3px 7px" : "4px 10px",
          borderRadius: compact ? 7 : 10,
          gap: 5,
          color: "var(--primary)",
          fontWeight: 800,
          fontSize: "0.74rem",
        }}
        title={carrierBrand}
      >
        <CarFront size={compact ? 13 : 16} />
        {!compact && <span>MARHABA</span>}
      </span>
    );
  }

  return (
    <span
      className="carrier-logo-pill"
      style={{
        height: compact ? 24 : Math.max(34, height + 10),
        padding: compact ? "3px 7px" : "4px 10px",
        borderRadius: compact ? 7 : 10,
        gap: 5,
        color: "#0f766e",
        fontWeight: 800,
        fontSize: "0.72rem",
      }}
      title={carrierBrand}
    >
      <Bus size={compact ? 13 : 16} />
      {!compact && <span>{carrierBrand.split(" ")[0]}</span>}
    </span>
  );
}

const TELECOM_LOGO_MAP: Record<TelecomOperatorId, { src: string; alt: string }> = {
  iam: { src: "/logos/maroctelecom.png", alt: "Maroc Telecom (IAM)" },
  orange: { src: "/logos/orange.png", alt: "Orange Maroc" },
  inwi: { src: "/logos/inwi.png", alt: "inwi Morocco" },
};

export function TelecomOfficialLogo({
  operatorId,
  height = 22,
  compact = false,
}: {
  operatorId: TelecomOperatorId;
  height?: number;
  compact?: boolean;
}) {
  const logo = TELECOM_LOGO_MAP[operatorId];
  return (
    <span
      className="carrier-logo-pill"
      style={{
        height: compact ? 24 : Math.max(32, height + 10),
        padding: compact ? "3px 6px" : "4px 10px",
        borderRadius: compact ? 7 : 10,
      }}
      title={logo.alt}
    >
      <img
        src={logo.src}
        alt={logo.alt}
        style={{
          height: compact ? 15 : height,
          width: "auto",
          maxWidth: compact ? 48 : 82,
          objectFit: "contain",
          display: "block",
        }}
      />
    </span>
  );
}
