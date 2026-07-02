function addThousandsSeparators(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatKRW(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  const formatted = addThousandsSeparators(abs);
  return `${sign}${formatted}원`;
}

export function formatKRWCompact(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);

  if (abs >= 100_000_000) {
    const eok = Math.floor(abs / 100_000_000);
    const remainder = abs % 100_000_000;
    const man = Math.round(remainder / 10_000);
    if (man === 0) {
      return `${sign}${eok}억 원`;
    }
    const manFormatted = addThousandsSeparators(man);
    return `${sign}${eok}억 ${manFormatted}만 원`;
  }

  if (abs >= 10_000) {
    const man = Math.round(abs / 10_000);
    const manFormatted = addThousandsSeparators(man);
    return `${sign}${manFormatted}만 원`;
  }

  const formatted = addThousandsSeparators(abs);
  return `${sign}${formatted}원`;
}

export function formatPercent(rate: number, digits = 1): string {
  const pct = rate * 100;
  return `${pct.toFixed(digits)}%`;
}

export function parseKRWInput(s: string): number | null {
  const trimmed = s.trim().replace(/,/g, "").replace(/원$/, "").trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parsePercentInput(s: string): number | null {
  const trimmed = s.trim().replace(/%$/, "").trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n / 100;
}

export function formatDifference(
  difference: number,
  dbAmount: number
): { winner: "DC" | "DB" | "TIE"; amountText: string } {
  void dbAmount;
  if (Math.abs(difference) < 100_000) {
    return { winner: "TIE", amountText: formatKRWCompact(0) };
  }
  const winner = difference > 0 ? "DC" : "DB";
  return { winner, amountText: formatKRWCompact(Math.abs(difference)) };
}

export function formatYears(n: number): string {
  return `${n}년`;
}
