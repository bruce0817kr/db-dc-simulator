import { describe, it, expect } from "vitest";
import {
  formatKRW,
  formatKRWCompact,
  formatPercent,
  parseKRWInput,
  parsePercentInput,
  formatDifference,
} from "./formatters";

describe("formatKRW", () => {
  it("formats positive number with commas and 원", () => {
    expect(formatKRW(259661236)).toBe("259,661,236원");
  });

  it("formats negative number with minus sign", () => {
    expect(formatKRW(-1234)).toBe("-1,234원");
  });

  it("rounds to integer", () => {
    expect(formatKRW(1000.7)).toBe("1,001원");
  });

  it("formats zero", () => {
    expect(formatKRW(0)).toBe("0원");
  });
});

describe("formatKRWCompact", () => {
  it("exactly 1억 → '1억 원'", () => {
    expect(formatKRWCompact(100_000_000)).toBe("1억 원");
  });

  it("2억 5966만 → '2억 5,966만 원'", () => {
    expect(formatKRWCompact(259_660_000)).toBe("2억 5,966만 원");
  });

  it("9999만 (just below 1억) → '9,999만 원'", () => {
    expect(formatKRWCompact(99_990_000)).toBe("9,999만 원");
  });

  it("1만 미만 → plain 원", () => {
    expect(formatKRWCompact(3500)).toBe("3,500원");
  });

  it("0 → '0원'", () => {
    expect(formatKRWCompact(0)).toBe("0원");
  });

  it("negative 억 단위 keeps sign", () => {
    expect(formatKRWCompact(-200_000_000)).toBe("-2억 원");
  });

  it("억 나머지 0이면 '2억 원'", () => {
    expect(formatKRWCompact(200_000_000)).toBe("2억 원");
  });

  it("exactly 1만 → '1만 원'", () => {
    expect(formatKRWCompact(10_000)).toBe("1만 원");
  });
});

describe("formatPercent", () => {
  it("0.034 → '3.4%' with default 1 digit", () => {
    expect(formatPercent(0.034)).toBe("3.4%");
  });

  it("0.03 → '3.0%'", () => {
    expect(formatPercent(0.03)).toBe("3.0%");
  });

  it("respects digits parameter", () => {
    expect(formatPercent(0.034, 2)).toBe("3.40%");
  });
});

describe("parseKRWInput", () => {
  it("parses comma-formatted string", () => {
    expect(parseKRWInput("80,000,000")).toBe(80_000_000);
  });

  it("parses plain integer string", () => {
    expect(parseKRWInput("80000000원")).toBe(80_000_000);
  });

  it("trims whitespace", () => {
    expect(parseKRWInput(" 8000 ")).toBe(8000);
  });

  it("round-trips with formatKRW (strip 원)", () => {
    const original = 50_000_000;
    const formatted = formatKRW(original).replace("원", "").trim();
    expect(parseKRWInput(formatted)).toBe(original);
  });

  it("empty string → null", () => {
    expect(parseKRWInput("")).toBeNull();
  });

  it("non-numeric → null", () => {
    expect(parseKRWInput("abc")).toBeNull();
  });
});

describe("parsePercentInput", () => {
  it("'3' → 0.03", () => {
    expect(parsePercentInput("3")).toBeCloseTo(0.03);
  });

  it("'3.5' → 0.035", () => {
    expect(parsePercentInput("3.5")).toBeCloseTo(0.035);
  });

  it("'3%' → 0.03", () => {
    expect(parsePercentInput("3%")).toBeCloseTo(0.03);
  });

  it("empty string → null", () => {
    expect(parsePercentInput("")).toBeNull();
  });

  it("non-numeric → null", () => {
    expect(parsePercentInput("abc")).toBeNull();
  });
});

describe("formatDifference", () => {
  it("99,999 → TIE (below threshold)", () => {
    const { winner } = formatDifference(99_999, 1_000_000);
    expect(winner).toBe("TIE");
  });

  it("100,001 → DC (above threshold)", () => {
    const { winner } = formatDifference(100_001, 1_000_000);
    expect(winner).toBe("DC");
  });

  it("negative 100,001 → DB", () => {
    const { winner } = formatDifference(-100_001, 1_000_000);
    expect(winner).toBe("DB");
  });

  it("DC case has correct amountText", () => {
    const { amountText } = formatDifference(5_000_000, 100_000_000);
    expect(amountText).toBe("500만 원");
  });
});
