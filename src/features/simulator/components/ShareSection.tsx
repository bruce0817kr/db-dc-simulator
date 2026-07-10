"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import type { SimulatorFormValues } from "../types";
import { buildShareUrl } from "../utils/urlParams";

interface ShareSectionProps {
  values: SimulatorFormValues;
  disabled: boolean;
}

export function ShareSection({ values, disabled }: ShareSectionProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [approvedAdvancedFingerprint, setApprovedAdvancedFingerprint] = useState<string | null>(
    null
  );
  const hasAdvancedValues =
    values.salaryPathMode !== "CONSTANT_GROWTH" || values.dbAverageSalary.trim().length > 0;
  const advancedFingerprint = JSON.stringify([
    values.salaryPathMode,
    values.peakStartYear,
    values.peakCutRate,
    values.peakPostGrowthRate,
    values.stepUpYear,
    values.stepUpRate,
    values.yearlySalaries,
    values.dbAverageSalary,
  ]);
  const includeAdvanced =
    hasAdvancedValues && approvedAdvancedFingerprint === advancedFingerprint;

  async function handleCopy() {
    try {
      const url = buildShareUrl(values, window.location.origin, { includeAdvanced });
      await navigator.clipboard.writeText(url);
      setMessage("복사되었습니다");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("복사에 실패했습니다. 주소창의 URL을 직접 복사해주세요.");
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <Button variant="secondary" onClick={handleCopy} disabled={disabled} type="button">
        공유 링크 복사
      </Button>
      {message && (
        <p className="text-xs text-gray-600">{message}</p>
      )}
      {hasAdvancedValues && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={includeAdvanced}
              onChange={(event) =>
                setApprovedAdvancedFingerprint(event.target.checked ? advancedFingerprint : null)
              }
              className="h-4 w-4 rounded border-amber-300 accent-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            />
            고급 임금 설정도 공유 링크에 포함
          </label>
          <p className="mt-1 text-xs text-amber-700">
            {includeAdvanced
              ? "연도별 연봉과 평균임금 등 현재 고급 설정이 URL에 그대로 포함됩니다. 공개 채널 공유에 유의하세요."
              : "고급 임금 시나리오 설정은 기본적으로 공유 링크에 포함되지 않습니다. 링크로 열면 기본 설정으로 표시됩니다."}
          </p>
        </div>
      )}
      <p className="text-xs text-gray-500">
        공유 링크에는 입력하신 연봉 등 재무 정보가 그대로 포함됩니다. 링크를 받은 사람은 누구나 볼 수 있으며, 이 서비스는 어떤 정보도 서버에 저장하지 않습니다.
      </p>
    </div>
  );
}
