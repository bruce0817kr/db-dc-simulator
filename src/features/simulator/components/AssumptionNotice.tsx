import { DEFAULT_RULE_SET } from "@/src/calculator";
import { formatPercent } from "../utils/formatters";

export function AssumptionNotice() {
  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
      본 결과는 입력값과 단순화된 계산 가정에 따른 세전 시뮬레이션입니다. 실제 퇴직급여는 회사 퇴직연금 규약, 평균임금 산정 방식, 임금피크제, 상여·성과급, 세금, 운용성과에 따라 달라질 수 있습니다.
      <details className="mt-2 print:hidden">
        <summary className="cursor-pointer">현재 서비스의 계산 가정</summary>
        <ul className="mt-1 list-disc pl-4">
          <li>기준 룰셋: {DEFAULT_RULE_SET.label}</li>
          <li>DC 부담금: 연간 임금총액의 1/12 (매년 말 납입 가정)</li>
          <li>위험자산 비중 한도: {formatPercent(DEFAULT_RULE_SET.riskyAssetLimit, 0)}</li>
          <li>수익률: 연 복리, 세전 명목 기준</li>
          <li>근속연수: 정수 단위</li>
          <li>DB 급여: 퇴직 시점 연봉의 월평균임금 × 전체 근속연수</li>
        </ul>
      </details>
    </div>
  );
}
