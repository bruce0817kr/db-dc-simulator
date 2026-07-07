"use client";

import { Button } from "@/src/components/ui/Button";

interface ReportSectionProps {
  disabled: boolean;
  onPrint: () => void;
}

export function ReportSection({ disabled, onPrint }: ReportSectionProps) {
  return (
    <div className="mt-4 flex flex-col gap-2 print:hidden">
      <Button variant="secondary" onClick={onPrint} disabled={disabled} type="button">
        보고서 인쇄 · PDF 저장
      </Button>
      <p className="text-xs text-gray-500">
        보고서에는 입력하신 연봉 등 재무 정보가 포함됩니다. 파일 보관·공유 시 유의하세요.
      </p>
    </div>
  );
}
