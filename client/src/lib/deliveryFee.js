export function getDeliveryFee(state) {
  if (!state) return 4000;

  const normalized = state.toLowerCase().trim();

  if (normalized === "delta") {
    return 2500;
  }

  return 4000;
}