"use client";

import { formatKRWCompact, formatPercent } from "../utils/formatters";

interface GrowthBreakevenRow {
  salaryGrowthRate: number;
  dbExpectedAmount: number;
  breakevenReturnRate: number | null;
}

interface GrowthBreakevenTableProps {
  rows: GrowthBreakevenRow[];
}

export function GrowthBreakevenTable({ rows }: GrowthBreakevenTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[400px] w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th scope="col" className="py-2 px-3 text-left font-semibold text-gray-600">임금상승률</th>
            <th scope="col" className="py-2 px-3 text-right font-semibold text-gray-600">DB 예상액</th>
            <th scope="col" className="py-2 px-3 text-right font-semibold text-gray-600">손익분기 DC 수익률</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.salaryGrowthRate} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-3 tabular-nums text-gray-700">{formatPercent(row.salaryGrowthRate, 0)}</td>
              <td className="py-2 px-3 text-right tabular-nums text-gray-900">{formatKRWCompact(row.dbExpectedAmount)}</td>
              <td className="py-2 px-3 text-right tabular-nums text-gray-900">
                {row.breakevenReturnRate !== null ? formatPercent(row.breakevenReturnRate) : "계산 불가"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
