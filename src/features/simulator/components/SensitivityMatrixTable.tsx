"use client";

import { SensitivityMatrix } from "@/src/calculator/sensitivity";
import { formatPercent } from "../utils/formatters";

interface SensitivityMatrixTableProps {
  matrix: SensitivityMatrix;
}

export function SensitivityMatrixTable({ matrix }: SensitivityMatrixTableProps) {
  const { salaryGrowthRates, dcReturnRates, points } = matrix;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-max text-sm border-collapse">
        <caption className="text-xs text-gray-500 mb-1 text-left">세로: 임금상승률, 가로: DC 운용수익률</caption>
        <thead>
          <tr className="border-b border-gray-200">
            <th scope="col" className="py-2 px-2 text-left font-semibold text-gray-600 whitespace-nowrap">상승률 \ 수익률</th>
            {dcReturnRates.map((r) => (
              <th key={r} scope="col" className="py-2 px-2 text-center font-semibold text-gray-600 whitespace-nowrap">
                {formatPercent(r, 0)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {salaryGrowthRates.map((g) => (
            <tr key={g} className="border-b border-gray-100">
              <th scope="row" className="py-2 px-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                {formatPercent(g, 0)}
              </th>
              {dcReturnRates.map((r) => {
                const pt = points.find(
                  (p) => Math.abs(p.salaryGrowthRate - g) < 1e-9 && Math.abs(p.dcReturnRate - r) < 1e-9
                );
                const cellText = pt?.winner === "DC" ? "DC" : pt?.winner === "DB" ? "DB" : "=";
                const cellColor =
                  pt?.winner === "DC"
                    ? "bg-green-100 text-green-800"
                    : pt?.winner === "DB"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-gray-100 text-gray-700";
                return (
                  <td key={r} className={`py-2 px-2 text-center font-medium ${cellColor}`}>
                    {cellText}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
