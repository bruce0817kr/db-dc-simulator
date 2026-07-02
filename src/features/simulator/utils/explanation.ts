import { SimulationInput, SimulationResult } from "@/src/calculator/types";
import { formatPercent, formatDifference } from "./formatters";
import { DisplayAmounts } from "./displayAmounts";

export interface ExplanationText {
  breakevenSentence: string;
  comparisonSentence: string;
}

export function buildExplanation(
  input: SimulationInput,
  result: SimulationResult,
  display?: DisplayAmounts
): ExplanationText {
  let breakevenSentence: string;
  if (result.breakevenReturnRate !== null) {
    breakevenSentence = `입력하신 조건에서는 DC 전환 후 연평균 ${formatPercent(result.breakevenReturnRate)} 이상 운용해야 DB 유지보다 유리합니다.`;
  } else {
    breakevenSentence = "입력하신 조건에서는 손익분기 수익률을 계산할 수 없습니다.";
  }

  const effectiveDifference = display !== undefined ? display.difference : result.difference;
  const effectiveDb = display !== undefined ? display.db : result.dbAmount;
  const { winner, amountText } = formatDifference(effectiveDifference, effectiveDb);
  let comparisonSentence: string;
  if (winner === "DC") {
    comparisonSentence = `현재 입력한 DC 운용수익률 ${formatPercent(input.dcReturnRate)} 기준으로는 DC가 약 ${amountText} 유리합니다.`;
  } else if (winner === "DB") {
    comparisonSentence = `현재 입력한 DC 운용수익률 ${formatPercent(input.dcReturnRate)} 기준으로는 DB가 약 ${amountText} 유리합니다.`;
  } else {
    comparisonSentence = "현재 입력한 조건에서는 DB와 DC 예상액이 거의 비슷합니다.";
  }

  return { breakevenSentence, comparisonSentence };
}
