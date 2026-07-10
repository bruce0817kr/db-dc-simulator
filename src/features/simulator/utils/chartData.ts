import type { SensitivityMatrix } from "@/src/calculator/sensitivity";

export const CHART_RETURN_RATE_MINIMUM = 0;
export const CHART_RETURN_RATE_MAXIMUM = 0.08;

export type RetirementComparisonChartDatum = {
  readonly dcReturnRate: number;
  readonly dbExpectedAmount: number;
  readonly dcExpectedAmount: number;
};

export type RateRangeStatus =
  | { readonly kind: "unavailable" }
  | { readonly kind: "below" }
  | { readonly kind: "inside"; readonly value: number }
  | { readonly kind: "above" };

export type AmountScale = {
  readonly minimum: number;
  readonly maximum: number;
  readonly ticks: readonly number[];
};

type SeriesDirection = "increases" | "decreases" | "unchanged";

type LinearScale = {
  readonly domainMinimum: number;
  readonly domainMaximum: number;
  readonly rangeMinimum: number;
  readonly rangeMaximum: number;
};

export function buildRetirementComparisonChartData(
  matrix: SensitivityMatrix
): readonly RetirementComparisonChartDatum[] {
  return matrix.points
    .map(({ dcReturnRate, dbExpectedAmount, dcExpectedAmount }) => ({
      dcReturnRate,
      dbExpectedAmount,
      dcExpectedAmount,
    }))
    .sort((left, right) => left.dcReturnRate - right.dcReturnRate);
}

export function getRateRangeStatus(rate: number | null): RateRangeStatus {
  if (rate === null) return { kind: "unavailable" };
  if (rate < CHART_RETURN_RATE_MINIMUM) return { kind: "below" };
  if (rate > CHART_RETURN_RATE_MAXIMUM) return { kind: "above" };
  return { kind: "inside", value: rate };
}

function getDirection(first: number, last: number): SeriesDirection {
  if (last > first) return "increases";
  if (last < first) return "decreases";
  return "unchanged";
}

function formatDirection(series: "DB" | "DC", direction: SeriesDirection): string {
  if (direction === "increases") return `${series} 예상액은 수익률이 높아질수록 증가합니다.`;
  if (direction === "decreases") return `${series} 예상액은 수익률이 높아질수록 감소합니다.`;
  return `${series} 예상액은 수익률 구간에서 동일합니다.`;
}

export function getSeriesDirectionDescription(data: readonly RetirementComparisonChartDatum[]): string {
  const first = data.at(0);
  const last = data.at(-1);
  if (first === undefined || last === undefined) return "DB와 DC 변화 방향을 확인할 수 없습니다.";

  return [
    formatDirection("DB", getDirection(first.dbExpectedAmount, last.dbExpectedAmount)),
    formatDirection("DC", getDirection(first.dcExpectedAmount, last.dcExpectedAmount)),
  ].join(" ");
}

function getNiceStep(maximum: number): number {
  const rawStep = maximum / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;

  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

export function createAmountScale(data: readonly RetirementComparisonChartDatum[]): AmountScale | null {
  if (data.length === 0) return null;

  const amounts = data.flatMap(({ dbExpectedAmount, dcExpectedAmount }) => [dbExpectedAmount, dcExpectedAmount]);
  if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) return null;

  const maximumValue = Math.max(...amounts);
  const step = getNiceStep(Math.max(maximumValue, 1));
  const maximum = step * Math.max(3, Math.ceil(maximumValue / step));

  if (!Number.isFinite(step) || !Number.isFinite(maximum) || maximum <= 0) return null;

  return {
    minimum: 0,
    maximum,
    ticks: [0, step, step * 2, maximum],
  };
}

export function scaleValue(value: number, scale: LinearScale): number {
  const domainSpan = scale.domainMaximum - scale.domainMinimum;
  const position = (value - scale.domainMinimum) / domainSpan;
  return scale.rangeMinimum + position * (scale.rangeMaximum - scale.rangeMinimum);
}
