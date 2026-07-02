"use client";

import { useMemo } from "react";
import { SimulationInput } from "@/src/calculator/types";
import { buildSensitivityMatrix, buildBreakevenByGrowthRate } from "@/src/calculator/sensitivity";
import { ReturnRateTable } from "./ReturnRateTable";
import { GrowthBreakevenTable } from "./GrowthBreakevenTable";
import { SensitivityMatrixTable } from "./SensitivityMatrixTable";

interface SensitivitySectionProps {
  input: SimulationInput;
}

export function SensitivitySection({ input }: SensitivitySectionProps) {
  const matrix = useMemo(() => buildSensitivityMatrix(input), [input]);
  const currentGrowthMatrix = useMemo(
    () => buildSensitivityMatrix(input, [input.wageGrowthRate]),
    [input]
  );
  const breakevenRows = useMemo(() => buildBreakevenByGrowthRate(input), [input]);

  return (
    <section className="mt-8 space-y-6">
      <h2 className="text-lg font-bold text-gray-900">가정이 달라지면?</h2>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">수익률별 결과 (현재 임금상승률 기준)</h3>
        <ReturnRateTable input={input} matrix={currentGrowthMatrix} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">임금상승률별 손익분기 수익률</h3>
        <GrowthBreakevenTable rows={breakevenRows} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">민감도 매트릭스</h3>
        <SensitivityMatrixTable matrix={matrix} />
      </div>

      <p className="text-xs text-gray-500">
        모든 표는 입력하신 조건을 기준으로 한 세전 추정 시뮬레이션입니다.
      </p>
    </section>
  );
}
