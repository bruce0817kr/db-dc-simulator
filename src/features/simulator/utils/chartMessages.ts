import type { RateRangeStatus } from "./chartData";
import { formatPercent } from "./formatters";

export function getBreakevenMessage(status: RateRangeStatus): string {
  switch (status.kind) {
    case "unavailable":
      return "입력하신 조건에서는 손익분기 수익률을 계산할 수 없습니다.";
    case "below":
      return "손익분기 수익률이 표시 범위(0~8%)보다 낮습니다.";
    case "inside":
      return `손익분기 약 ${formatPercent(status.value)}`;
    case "above":
      return "손익분기 수익률이 표시 범위(0~8%)보다 높습니다.";
  }
}

export function getCurrentRateMessage(status: RateRangeStatus): string {
  switch (status.kind) {
    case "inside":
      return `현재 입력 ${formatPercent(status.value)}`;
    case "unavailable":
    case "below":
    case "above":
      return "현재 입력 수익률은 표시 범위 밖입니다.";
  }
}
