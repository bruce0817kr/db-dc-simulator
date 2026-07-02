"use client";

import { FieldErrors } from "../types";

interface DisplayModeToggleProps {
  showAfterTax: boolean;
  showPresentValue: boolean;
  inflationRate: string;
  errors: Pick<FieldErrors, "inflationRate">;
  onToggleDisplay: (field: "showAfterTax" | "showPresentValue") => void;
  onChange: (field: "inflationRate", value: string) => void;
}

export function DisplayModeToggle({
  showAfterTax,
  showPresentValue,
  inflationRate,
  errors,
  onToggleDisplay,
  onChange,
}: DisplayModeToggleProps) {
  return (
    <div className="mb-4 space-y-3">
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={showAfterTax}
          onChange={() => onToggleDisplay("showAfterTax")}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm font-medium text-gray-700">세후 금액 보기</span>
      </label>

      <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={showPresentValue}
          onChange={() => onToggleDisplay("showPresentValue")}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm font-medium text-gray-700">현재가치로 보기</span>
      </label>

      {showPresentValue && (
        <div className="ml-7 space-y-1">
          <label htmlFor="inflationRate" className="block text-xs font-medium text-gray-600">
            물가상승률 (%)
          </label>
          <input
            id="inflationRate"
            type="text"
            inputMode="decimal"
            value={inflationRate}
            onChange={(e) => onChange("inflationRate", e.target.value)}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.inflationRate && (
            <p className="text-xs text-red-600">{errors.inflationRate}</p>
          )}
        </div>
      )}
    </div>
  );
}
