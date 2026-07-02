import { SimulationResult } from "@/src/calculator/types";
import { Card } from "@/src/components/ui/Card";
import {
  formatKRW,
  formatKRWCompact,
  formatPercent,
  formatDifference,
} from "../utils/formatters";

interface ResultSummaryCardsProps {
  result: SimulationResult;
}

export function ResultSummaryCards({ result }: ResultSummaryCardsProps) {
  const { winner, amountText } = formatDifference(result.difference, result.dbAmount);

  const winnerLabel =
    winner === "DC" ? "DC 유리" : winner === "DB" ? "DB 유리" : "거의 동일";
  const winnerSymbol = winner === "DC" ? "▲" : winner === "DB" ? "▼" : "=";
  const winnerColor =
    winner === "DC"
      ? "bg-green-100 text-green-800"
      : winner === "DB"
      ? "bg-orange-100 text-orange-800"
      : "bg-gray-100 text-gray-700";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card>
        <p className="text-xs font-medium text-gray-500">손익분기 수익률</p>
        <p className="mt-1 text-xl font-bold tabular-nums break-keep min-w-0 text-gray-900">
          {result.breakevenReturnRate !== null
            ? formatPercent(result.breakevenReturnRate)
            : "계산 불가"}
        </p>
      </Card>

      <Card>
        <p className="text-xs font-medium text-gray-500">차이 금액</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xl font-bold tabular-nums break-keep min-w-0 text-gray-900">
            {amountText}
          </p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${winnerColor}`}
          >
            {winnerSymbol} {winnerLabel}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">
          {formatKRW(Math.abs(result.difference))}
        </p>
      </Card>

      <Card>
        <p className="text-xs font-medium text-gray-500">DC 전환 예상액</p>
        <p className="mt-1 text-xl font-bold tabular-nums break-keep min-w-0 text-gray-900">
          {formatKRWCompact(result.dcAmount)}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{formatKRW(result.dcAmount)}</p>
      </Card>

      <Card>
        <p className="text-xs font-medium text-gray-500">DB 유지 예상액</p>
        <p className="mt-1 text-xl font-bold tabular-nums break-keep min-w-0 text-gray-900">
          {formatKRWCompact(result.dbAmount)}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{formatKRW(result.dbAmount)}</p>
      </Card>
    </div>
  );
}
