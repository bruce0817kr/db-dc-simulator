// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildStressNarrative } from "./stressNarrative";
import { StressScenario } from "@/src/calculator";

const DB_AMOUNT = 200_000_000;

function makeScenarios(diffs: number[]): StressScenario[] {
  return diffs.map((differenceVsDb, i) => ({
    dropRate: (i + 1) * 0.1,
    stressedDcAmount: DB_AMOUNT + differenceVsDb,
    differenceVsDb,
  }));
}

describe("buildStressNarrative", () => {
  it("분기(1): 기준 DC 유리 + 첫 뒤집힘 시나리오 선택 정확성", () => {
    const baseDiff = 5_000_000;
    const scenarios = makeScenarios([3_000_000, -2_000_000, -5_000_000, -10_000_000]);
    const { baseSentence, stressSentence } = buildStressNarrative(baseDiff, DB_AMOUNT, scenarios);

    expect(baseSentence).toContain("DC가");
    expect(baseSentence).toContain("유리합니다");
    expect(stressSentence).toContain("20%");
    expect(stressSentence).toContain("불리해질 수 있습니다");
  });

  it("분기(2): 전 시나리오에서 안 뒤집힘 → 40% 하락 메시지", () => {
    const baseDiff = 50_000_000;
    const scenarios = makeScenarios([40_000_000, 30_000_000, 20_000_000, 10_000_000]);
    const { baseSentence, stressSentence } = buildStressNarrative(baseDiff, DB_AMOUNT, scenarios);

    expect(baseSentence).toContain("DC가");
    expect(stressSentence).toBe("40% 하락 가정에서도 DC가 DB보다 유리합니다.");
  });

  it("분기(3): 기준부터 DB 유리 → DB 유리 고정 메시지", () => {
    const baseDiff = -8_000_000;
    const scenarios = makeScenarios([-10_000_000, -15_000_000, -20_000_000, -25_000_000]);
    const { baseSentence, stressSentence } = buildStressNarrative(baseDiff, DB_AMOUNT, scenarios);

    expect(baseSentence).toContain("DB가");
    expect(stressSentence).toBe("기준 시나리오부터 DB가 유리하며, 하락 시 격차가 더 커질 수 있습니다.");
  });

  it("분기(1): TIE 기준 → 첫 뒤집힘 시나리오 탐색", () => {
    const baseDiff = 50_000;
    const scenarios = makeScenarios([30_000, -500_000, -1_000_000, -2_000_000]);
    const { baseSentence, stressSentence } = buildStressNarrative(baseDiff, DB_AMOUNT, scenarios);

    expect(baseSentence).toBe("기준 시나리오에서는 DB와 DC 예상액이 거의 비슷합니다.");
    expect(stressSentence).toContain("20%");
    expect(stressSentence).toContain("불리해질 수 있습니다");
  });
});
