"use client";

import { SimulationInput } from "@/src/calculator/types";
import { SensitivityMatrix } from "@/src/calculator/sensitivity";
import { formatKRWCompact, formatPercent } from "../utils/formatters";

interface ReturnRateTableProps {
  input: SimulationInput;
  matrix: SensitivityMatrix;
}

export function ReturnRateTable({ input, matrix }: ReturnRateTableProps) {
  const { dcReturnRates, points } = matrix;

  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="min-w-[480px] w-full text-sm border-collapse print:min-w-0">
        <thead>
          <tr className="border-b border-gray-200">
            <th scope="col" className="py-2 px-3 text-left font-semibold text-gray-600">DC 수익률</th>
            <th scope="col" className="py-2 px-3 text-right font-semibold text-gray-600">DC 예상액</th>
            <th scope="col" className="py-2 px-3 text-right font-semibold text-gray-600">차이</th>
            <th scope="col" className="py-2 px-3 text-center font-semibold text-gray-600">유불리</th>
          </tr>
        </thead>
        <tbody>
          {dcReturnRates.map((r) => {
            const pt = points.find((p) => Math.abs(p.dcReturnRate - r) < 1e-9);
            const isCurrent = Math.abs(r - input.dcReturnRate) < 1e-9;
            const rowClass = isCurrent ? "bg-blue-50" : "hover:bg-gray-50";

            const winnerLabel =
              pt?.winner === "DC" ? "DC 유리" : pt?.winner === "DB" ? "DB 유리" : "거의 동일";
            const winnerColor =
              pt?.winner === "DC"
                ? "bg-green-100 text-green-800"
                : pt?.winner === "DB"
                ? "bg-orange-100 text-orange-800"
                : "bg-gray-100 text-gray-700";

            const diffSign = pt && pt.difference > 0 ? "+" : "";

            return (
              <tr key={r} className={`border-b border-gray-100 ${rowClass}`}>
                <td className="py-2 px-3 tabular-nums text-gray-700">
                  {formatPercent(r, 0)}
                  {isCurrent && (
                    <span className="ml-2 text-xs text-blue-600 font-medium">현재 입력</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-gray-900">
                  {pt ? formatKRWCompact(pt.dcExpectedAmount) : "-"}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-gray-900">
                  {pt ? `${diffSign}${formatKRWCompact(pt.difference)}` : "-"}
                </td>
                <td className="py-2 px-3 text-center">
                  {pt && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${winnerColor}`}>
                      {winnerLabel}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
