import { DEFAULT_RULE_SET } from "@/src/calculator";
import { TAX_RULE_YEAR } from "@/src/calculator/tax-rules";
import { SimulationInput } from "@/src/calculator/types";
import { formatKRW, formatPercent, parseKRWInput } from "../utils/formatters";
import { SimulatorFormValues } from "../types";

interface PrintReportHeaderProps {
  values: SimulatorFormValues;
  input: SimulationInput;
  generatedAt: string | null;
}

export function PrintReportHeader({ values, input, generatedAt }: PrintReportHeaderProps) {
  const conversionLabel =
    values.conversionMethod === "CUSTOM_TRANSFER_AMOUNT"
      ? `정산금 직접 입력 (${values.customTransferAmount}원)`
      : "과거분 전액 DC 이전";

  let salaryScenarioLabel: string;
  if (values.salaryPathMode === "WAGE_PEAK") {
    salaryScenarioLabel = `임금피크제 — 피크 ${values.peakStartYear}년차, 감액 ${values.peakCutRate}%, 이후 상승률 ${values.peakPostGrowthRate}%`;
  } else if (values.salaryPathMode === "STEP_UP") {
    salaryScenarioLabel = `승진·호봉 점프 — ${values.stepUpYear}년차 이후 ${values.stepUpRate}% 상승`;
  } else if (values.salaryPathMode === "YEARLY_CUSTOM") {
    const n = input.remainingServiceYears;
    const nums = values.yearlySalaries
      .map(parseKRWInput)
      .filter((x): x is number => x !== null && x > 0);
    salaryScenarioLabel =
      `연도별 직접 입력 — ${n}년치` +
      (nums.length > 0
        ? ` (첫 ${formatKRW(nums[0])} / 마지막 ${formatKRW(nums[nums.length - 1])})`
        : "");
  } else {
    salaryScenarioLabel = "기본 (일정 상승)";
  }
  if (values.dbAverageSalary) {
    salaryScenarioLabel += ` / 평균임금 override: ${values.dbAverageSalary}원`;
  }

  let displayModeLabel: string;
  if (values.showAfterTax && values.showPresentValue) {
    displayModeLabel = `세후·현재가치 (물가상승률 ${values.inflationRate}%)`;
  } else if (values.showAfterTax) {
    displayModeLabel = "세후";
  } else if (values.showPresentValue) {
    displayModeLabel = `현재가치 (물가상승률 ${values.inflationRate}%)`;
  } else {
    displayModeLabel = "세전";
  }

  return (
    <div className="hidden print:block">
      <h1 className="text-2xl font-bold text-gray-900">
        DB/DC 퇴직연금 전환 시뮬레이션 보고서
      </h1>
      {generatedAt && (
        <p className="mt-1 text-sm text-gray-600">생성: {generatedAt}</p>
      )}

      <table className="mt-4 w-full border-collapse text-sm">
        <tbody>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left font-semibold text-gray-700 w-48">현재 연봉</th>
            <td className="py-2 text-gray-900">{values.currentSalary}원</td>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left font-semibold text-gray-700">현재 근속연수</th>
            <td className="py-2 text-gray-900">{input.currentServiceYears}년</td>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left font-semibold text-gray-700">남은 근속연수</th>
            <td className="py-2 text-gray-900">{input.remainingServiceYears}년</td>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left font-semibold text-gray-700">임금상승률</th>
            <td className="py-2 text-gray-900">{values.salaryGrowthRate}%</td>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left font-semibold text-gray-700">DC 수익률</th>
            <td className="py-2 text-gray-900">{values.dcReturnRate}%</td>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left font-semibold text-gray-700">연간 변동성</th>
            <td className="py-2 text-gray-900">{values.dcVolatility}%</td>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left font-semibold text-gray-700">전환 방식</th>
            <td className="py-2 text-gray-900">{conversionLabel}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left font-semibold text-gray-700">임금 경로 설정</th>
            <td className="py-2 text-gray-900">{salaryScenarioLabel}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left font-semibold text-gray-700">표시 모드</th>
            <td className="py-2 text-gray-900">{displayModeLabel}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        <p className="font-semibold">계산 가정</p>
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li>기준 룰셋: {DEFAULT_RULE_SET.label}</li>
          <li>DC 부담금: 연간 임금총액의 1/12 (매년 말 납입 가정)</li>
          <li>위험자산 비중 한도: {formatPercent(DEFAULT_RULE_SET.riskyAssetLimit, 0)}</li>
          <li>수익률: 연 복리, 세전 명목 기준</li>
          <li>근속연수: 정수 단위</li>
          <li>DB 급여: 퇴직 시점 연봉의 월평균임금 × 전체 근속연수</li>
          <li>세법 기준 연도: {TAX_RULE_YEAR}년</li>
        </ul>
      </div>

      <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        <p className="font-semibold">본 보고서는 투자 권유가 아닌 시뮬레이션 결과입니다.</p>
        <p className="mt-2">
          입력값과 단순화된 가정에 기반한 세전 추정치입니다. 실제 퇴직급여는 회사 퇴직연금 규약, 평균임금 산정 방식, 임금피크제, 상여·성과급, 세금, 운용성과에 따라 달라질 수 있습니다.
        </p>
      </div>
    </div>
  );
}
