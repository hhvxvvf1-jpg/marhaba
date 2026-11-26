export type Currency = "MAD" | "EUR" | "USD";
export type Language = "en" | "fr" | "ar" | "es" | "de" | "it" | "pt";
export type ThemeMode = "light" | "dark";

export const CURRENCY_RATES: Record<Currency, number> = {
  MAD: 1,
  EUR: 0.092,
  USD: 0.1,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  MAD: "MAD",
  EUR: "€",
  USD: "$",
};

export const PLATFORM_DEFAULTS = {
  defaultCommissionPct: 15,
  touristTaxPerNightMad: 25,
  vatPct: 10,
  serviceFeePct: 4,
  holdExpirationMinutes: 15,
  referralRewardMad: 150,
};

const LOCALE_MAP: Record<Language, string> = {
  en: "en-US",
  fr: "fr-FR",
  ar: "ar-MA",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
};

export function formatMoney(amountMad: number, currency: Currency = "MAD", lang: Language = "en"): string {
  const rate = CURRENCY_RATES[currency] || 1;
  const converted = amountMad * rate;
  const locale = LOCALE_MAP[lang] || "en-US";
  const rounded = currency === "MAD" ? Math.round(converted) : Math.round(converted * 100) / 100;
  return `${rounded.toLocaleString(locale)} ${currency}`;
}
