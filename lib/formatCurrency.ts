export function formatCurrency(amount: number): string {
  const formatted = Math.round(amount).toLocaleString("id-ID");
  return `Rp ${formatted}`;
}

export function formatCurrencyShort(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded >= 1_000_000_000) {
    return `Rp ${(rounded / 1_000_000_000).toFixed(1)}M`;
  }
  if (rounded >= 1_000_000) {
    return `Rp ${(rounded / 1_000_000).toFixed(1)}jt`;
  }
  if (rounded >= 1_000) {
    return `Rp ${(rounded / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${rounded}`;
}
