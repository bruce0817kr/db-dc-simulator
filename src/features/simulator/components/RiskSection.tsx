"use client";

import { useMemo } from "react";
import { SimulationInput } from "@/src/calculator/types";
import { runMonteCarlo } from "@/src/calculator/monte-carlo";
import { formatKRWCompact, formatPercent } from "../utils/formatters";

interface RiskSectionProps {
  input: SimulationInput;
  volatility: number;
  dbAmount: number;
}

export function RiskSection({ input, volatility, dbAmount }: RiskSectionProps) {
  const mc = useMemo(
    () =>
      runMonteCarlo({
        baseInput: input,
        expectedReturnRate: input.dcReturnRate,
        volatility,
        iterations: 1000,
        seed: 20260702,
      }),
    [input, volatility]
  );

  const worstDiff = mc.p5 - dbAmount;

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">
        운용 성과가 흔들린다면? (리스크 시뮬레이션) <span className="text-sm font-normal text-gray-400">(세전 기준)</span>
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">예상 범위 (5~95%)</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatKRWCompact(mc.p5)} ~ {formatKRWCompact(mc.p95)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">중앙값 (p50)</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatKRWCompact(mc.p50)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">DC가 DB보다 유리할 확률</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatPercent(mc.probabilityDcBeatsDb, 0)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">하위 5% 시나리오</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {worstDiff >= 0
              ? `나쁜 경우에도 DB보다 약 ${formatKRWCompact(worstDiff)} 많습니다`
              : `DB보다 약 ${formatKRWCompact(Math.abs(worstDiff))} 적을 수 있습니다`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th scope="col" className="py-2 text-left text-xs font-semibold text-gray-600">
                분위
              </th>
              <th scope="col" className="py-2 text-right text-xs font-semibold text-gray-600">
                DC 예상액
              </th>
            </tr>
          </thead>
          <tbody>
            {([
              ["p5 (하위 5%)", mc.p5],
              ["p25 (하위 25%)", mc.p25],
              ["p50 (중앙값)", mc.p50],
              ["p75 (상위 25%)", mc.p75],
              ["p95 (상위 5%)", mc.p95],
            ] as [string, number][]).map(([label, value]) => (
              <tr key={label} className="border-b border-gray-100">
                <td className="py-2 text-gray-700">{label}</td>
                <td className="py-2 text-right text-gray-900">{formatKRWCompact(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        본 결과는 1,000회 확률적 시뮬레이션의 예상 범위이며, 실제 수익률 경로에 따라 달라질 수 있습니다. 확정 예측이 아닙니다.
      </p>
    </section>
  );
}
