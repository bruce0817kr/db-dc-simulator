import { StressScenario } from "@/src/calculator";
import { formatKRWCompact, formatPercent, formatDifference } from "./formatters";

export function buildStressNarrative(
  baseDifference: number,
  dbAmount: number,
  scenarios: StressScenario[]
): { baseSentence: string; stressSentence: string } {
  const { winner } = formatDifference(baseDifference, dbAmount);

  let baseSentence: string;
  if (winner === "DC") {
    baseSentence = `기준 시나리오에서는 DC가 약 ${formatKRWCompact(Math.abs(baseDifference))} 유리합니다.`;
  } else if (winner === "DB") {
    baseSentence = `기준 시나리오에서는 DB가 약 ${formatKRWCompact(Math.abs(baseDifference))} 유리합니다.`;
  } else {
    baseSentence = "기준 시나리오에서는 DB와 DC 예상액이 거의 비슷합니다.";
  }

  let stressSentence: string;
  if (winner === "DB") {
    stressSentence = "기준 시나리오부터 DB가 유리하며, 하락 시 격차가 더 커질 수 있습니다.";
  } else {
    const firstFlip = scenarios.find((s) => {
      const { winner: sw } = formatDifference(s.differenceVsDb, dbAmount);
      return sw === "DB";
    });
    if (firstFlip) {
      stressSentence = `하지만 퇴직 직전 위험자산이 ${formatPercent(firstFlip.dropRate, 0)} 하락하면 DC가 DB보다 약 ${formatKRWCompact(Math.abs(firstFlip.differenceVsDb))} 불리해질 수 있습니다.`;
    } else {
      stressSentence = "40% 하락 가정에서도 DC가 DB보다 유리합니다.";
    }
  }

  return { baseSentence, stressSentence };
}
