const COLOR_ALIASES = {
  steel: "#71797e",
  silver: "#c0c0c0",
  gold: "#d4af37",
  "rose gold": "#b76e79",
  rosegold: "#b76e79",
  champagne: "#f7e7ce",
  nude: "#e3bc9a",
  brown: "#8b4513",
  black: "#111111",
  white: "#f5f5f5",
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  gray: "#6b7280",
  grey: "#6b7280",
};

export function resolveColorSwatch(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return COLOR_ALIASES[normalized] || normalized;
}
