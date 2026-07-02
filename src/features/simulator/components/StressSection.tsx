"use client";

import { useMemo } from "react";
import { SimulationInput, SimulationResult } from "@/src/calculator/types";
import { buildStressScenarios } from "@/src/calculator";
import { formatKRWCompact, formatPercent, formatDifference } from "../utils/formatters";
import { buildStressNarrative } from "../utils/stressNarrative";

interface StressSectionProps {
  input: SimulationInput;
  result: SimulationResult;
  riskyAssetWeight: number;
  isCustomWeight: boolean;
}

export function StressSection({ input, result, riskyAssetWeight, isCustomWeight }: StressSectionProps) {
  const scenarios = useMemo(
    () => buildStressScenarios(input, riskyAssetWeight),
    [input, riskyAssetWeight]
  );

  const { baseSentence, stressSentence } = useMemo(
    () => buildStressNarrative(result.difference, result.dbAmount, scenarios),
    [result.difference, result.dbAmount, scenarios]
  );

  const assumptionText = isCustomWeight
    ? "가정: 위험자산 비중 100% (직접 입력 시 보수적 가정)"
    : `가정: 위험자산 비중 ${formatPercent(riskyAssetWeight, 0)} (선택한 프리셋 기준)`;

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">
        퇴직 직전 시장이 하락한다면? (스트레스 테스트)
      </h2>

      <p className="text-xs text-gray-500">{assumptionText}</p>

      {riskyAssetWeight === 0 ? (
        <>
          <p className="text-sm text-gray-700">
            선택한 구성은 위험자산이 없어 이 시나리오의 영향을 받지 않습니다.
          </p>
          <p className="text-sm text-gray-700">{baseSentence}</p>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-700">{baseSentence}</p>
          <p className="text-sm text-gray-700">{stressSentence}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th scope="col" className="py-2 text-left text-xs font-semibold text-gray-600">
                    하락률
                  </th>
                  <th scope="col" className="py-2 text-right text-xs font-semibold text-gray-600">
                    스트레스 DC 예상액
                  </th>
                  <th scope="col" className="py-2 text-right text-xs font-semibold text-gray-600">
                    DB 대비
                  </th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => {
                  const { winner, amountText } = formatDifference(s.differenceVsDb, result.dbAmount);
                  const sign = winner === "DC" ? "+" : winner === "DB" ? "−" : "";
                  const badgeLabel =
                    winner === "DC" ? "DC 유리" : winner === "DB" ? "DB 유리" : "거의 동일";
                  const badgeClass =
                    winner === "DC"
                      ? "ml-1 rounded px-1 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700"
                      : winner === "DB"
                      ? "ml-1 rounded px-1 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700"
                      : "ml-1 rounded px-1 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600";
                  return (
                    <tr key={s.dropRate} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">{formatPercent(s.dropRate, 0)}</td>
                      <td className="py-2 text-right text-gray-900">
                        {formatKRWCompact(s.stressedDcAmount)}
                      </td>
                      <td className="py-2 text-right text-gray-900">
                        {winner === "TIE" ? (
                          <span className={badgeClass}>{badgeLabel}</span>
                        ) : (
                          <>
                            {sign}{amountText}
                            <span className={badgeClass}>{badgeLabel}</span>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-gray-500">
        쇼크는 퇴직 직전 1회 발생을 가정한 단순화 모델입니다. 실제 하락은 시점과 회복 여부에 따라 영향이 다를 수 있습니다.
      </p>
    </section>
  );
}
