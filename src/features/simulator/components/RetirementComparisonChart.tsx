"use client";

import { useId } from "react";
import type { SensitivityMatrix } from "@/src/calculator/sensitivity";
import type { SimulationInput, SimulationResult } from "@/src/calculator/types";
import {
  buildRetirementComparisonChartData,
  CHART_RETURN_RATE_MAXIMUM,
  CHART_RETURN_RATE_MINIMUM,
  createAmountScale,
  getRateRangeStatus,
  getSeriesDirectionDescription,
  getSeriesLabelPositions,
  scaleValue,
} from "../utils/chartData";
import { RETIREMENT_CHART_LAYOUT as CHART } from "../utils/chartLayout";
import { getBreakevenMessage, getCurrentRateMessage } from "../utils/chartMessages";
import { formatKRWCompact, formatPercent } from "../utils/formatters";

type RetirementComparisonChartProps = {
  readonly input: SimulationInput;
  readonly result: SimulationResult;
  readonly matrix: SensitivityMatrix;
};

export function RetirementComparisonChart({ input, result, matrix }: RetirementComparisonChartProps) {
  const titleId = useId();
  const descriptionId = useId();
  const data = buildRetirementComparisonChartData(matrix);
  const amountScale = createAmountScale(data);
  const firstDatum = data.at(0);
  const lastDatum = data.at(-1);
  const breakevenStatus = getRateRangeStatus(result.breakevenReturnRate);
  const currentRateStatus = getRateRangeStatus(input.dcReturnRate);
  const breakevenMessage = getBreakevenMessage(breakevenStatus);
  const currentRateMessage = getCurrentRateMessage(currentRateStatus);

  if (amountScale === null || firstDatum === undefined || lastDatum === undefined) {
    return (
      <figure className="break-inside-avoid rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">차트로 표시할 민감도 데이터가 없습니다.</p>
        <p className="mt-2 text-xs text-gray-500">{breakevenMessage}</p>
        <figcaption className="mt-3 text-xs text-gray-500">
          입력하신 조건과 현재 임금상승률을 기준으로 한 세전 시뮬레이션입니다.
        </figcaption>
      </figure>
    );
  }

  const plotRight = CHART.width - CHART.right;
  const plotBottom = CHART.height - CHART.bottom;
  const x = (rate: number) =>
    scaleValue(rate, {
      domainMinimum: CHART_RETURN_RATE_MINIMUM,
      domainMaximum: CHART_RETURN_RATE_MAXIMUM,
      rangeMinimum: CHART.left,
      rangeMaximum: plotRight,
    });
  const y = (amount: number) =>
    scaleValue(amount, {
      domainMinimum: amountScale.minimum,
      domainMaximum: amountScale.maximum,
      rangeMinimum: plotBottom,
      rangeMaximum: CHART.top,
    });
  const dbPoints = data.map((datum) => `${x(datum.dcReturnRate)},${y(datum.dbExpectedAmount)}`).join(" ");
  const dcPoints = data.map((datum) => `${x(datum.dcReturnRate)},${y(datum.dcExpectedAmount)}`).join(" ");
  const axisRates = [0, 0.02, 0.04, 0.06, 0.08] as const;
  const directionDescription = getSeriesDirectionDescription(data);
  const description = `DC 수익률 0%부터 8%까지의 DB와 DC 예상 퇴직급여 비교입니다. ${directionDescription} ${breakevenMessage} ${currentRateMessage}`;
  const dbLabelY = y(lastDatum.dbExpectedAmount);
  const dcLabelY = y(lastDatum.dcExpectedAmount);
  const labelPositions = getSeriesLabelPositions(dbLabelY, dcLabelY);
  const breakevenLabelOnRight =
    breakevenStatus.kind === "inside" && breakevenStatus.value >= CHART_RETURN_RATE_MAXIMUM - 0.01;

  return (
    <figure className="break-inside-avoid rounded-lg border border-gray-200 bg-white p-2 sm:p-4">
      <svg
        className="w-full"
        height={CHART.height}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        role="img"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        preserveAspectRatio="xMidYMid meet"
      >
        <title id={titleId}>DB/DC 예상 퇴직급여 비교 차트</title>
        <desc id={descriptionId}>{description}</desc>

        <g aria-hidden="true" focusable="false">
          {amountScale.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={CHART.left}
                x2={plotRight}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-gray-200"
                vectorEffect="non-scaling-stroke"
              />
              <text x={CHART.left - 12} y={y(tick) + 4} textAnchor="end" className="fill-gray-500 text-lg sm:text-xs">
                {formatKRWCompact(tick)}
              </text>
            </g>
          ))}
          <line
            x1={CHART.left}
            x2={plotRight}
            y1={plotBottom}
            y2={plotBottom}
            className="stroke-gray-400"
            vectorEffect="non-scaling-stroke"
          />
          {axisRates.map((rate) => (
            <g key={rate}>
              <line
                x1={x(rate)}
                x2={x(rate)}
                y1={plotBottom}
                y2={plotBottom + 5}
                className="stroke-gray-400"
                vectorEffect="non-scaling-stroke"
              />
              <text x={x(rate)} y={plotBottom + 22} textAnchor="middle" className="fill-gray-600 text-xl sm:text-xs">
                {formatPercent(rate, 0)}
              </text>
            </g>
          ))}
          <text
            x={(CHART.left + plotRight) / 2}
            y={CHART.height - 10}
            textAnchor="middle"
            className="fill-gray-600 text-xl font-medium sm:text-xs"
          >
            DC 연평균 운용수익률
          </text>
        </g>

        {breakevenStatus.kind === "inside" && (
          <g>
            <line
              x1={x(breakevenStatus.value)}
              x2={x(breakevenStatus.value)}
              y1={CHART.top}
              y2={plotBottom}
              className="stroke-gray-700"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
            />
            <text
              data-chart-label="breakeven"
              x={x(breakevenStatus.value) + (breakevenLabelOnRight ? -6 : 6)}
              y={CHART.top + 14}
              textAnchor={breakevenLabelOnRight ? "end" : "start"}
              className="fill-gray-700 text-lg font-semibold sm:text-xs"
            >
              {breakevenMessage}
            </text>
          </g>
        )}

        <polyline
          data-series="DB"
          points={dbPoints}
          fill="none"
          className="stroke-amber-700"
          strokeWidth="2"
          strokeDasharray="8 6"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((datum) => (
          <circle
            key={`db-${datum.dcReturnRate}`}
            data-point-series="DB"
            cx={x(datum.dcReturnRate)}
            cy={y(datum.dbExpectedAmount)}
            r="3.5"
            className="fill-white stroke-amber-700"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <text
          data-chart-label="db-series"
          x={plotRight + 8}
          y={labelPositions.db}
          className="fill-amber-700 text-xl font-semibold sm:text-xs"
        >
          DB 예상액
        </text>

        <polyline
          data-series="DC"
          points={dcPoints}
          fill="none"
          className="stroke-blue-700"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((datum) => (
          <rect
            key={`dc-${datum.dcReturnRate}`}
            data-point-series="DC"
            x={x(datum.dcReturnRate) - 3.5}
            y={y(datum.dcExpectedAmount) - 3.5}
            width="7"
            height="7"
            className="fill-white stroke-blue-700"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <text
          data-chart-label="dc-series"
          x={plotRight + 8}
          y={labelPositions.dc}
          className="fill-blue-700 text-xl font-semibold sm:text-xs"
        >
          DC 예상액
        </text>

        {currentRateStatus.kind === "inside" && (
          <g>
            <circle
              cx={x(currentRateStatus.value)}
              cy={y(result.dcAmount)}
              r="6"
              className="fill-white stroke-blue-700"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            <text
              data-chart-label="current-rate"
              x={x(currentRateStatus.value)}
              y={y(result.dcAmount) - 12}
              textAnchor="middle"
              className="fill-blue-700 text-lg font-semibold sm:text-xs"
            >
              {currentRateMessage}
            </text>
          </g>
        )}
      </svg>

      {(breakevenStatus.kind !== "inside" || currentRateStatus.kind !== "inside") && (
        <div className="space-y-1 px-2 text-xs text-gray-600">
          {breakevenStatus.kind !== "inside" && <p>{breakevenMessage}</p>}
          {currentRateStatus.kind !== "inside" && <p>{currentRateMessage}</p>}
        </div>
      )}
      <figcaption className="mt-2 px-2 text-xs text-gray-500">
        입력하신 조건과 현재 임금상승률을 기준으로 한 세전 시뮬레이션입니다. 선은 확정 수익이나 운용성과를 보장하지
        않습니다.
      </figcaption>
    </figure>
  );
}
