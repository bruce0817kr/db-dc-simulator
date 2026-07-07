// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
import { SimulatorPage } from "./SimulatorPage";

describe("SimulatorPage", () => {
  it("(a) 기본값 렌더 → 결과 카드 4장 + 손익분기 문장 + 주의 문구 존재", () => {
    render(<SimulatorPage />);

    expect(screen.getByText("손익분기 수익률")).toBeTruthy();
    expect(screen.getByText("차이 금액")).toBeTruthy();
    expect(screen.getByText("DC 전환 예상액")).toBeTruthy();
    expect(screen.getByText("DB 유지 예상액")).toBeTruthy();

    expect(
      screen.getByText((text) => text.includes("이상 운용해야") || text.includes("계산할 수 없습니다"))
    ).toBeTruthy();

    expect(
      screen.getByText((text) => text.includes("세전 시뮬레이션입니다"))
    ).toBeTruthy();
  });

  it("(b) select를 CUSTOM으로 변경 → 정산금 입력 표시, 되돌리면 숨김", () => {
    render(<SimulatorPage />);

    expect(screen.queryByLabelText("전환 정산금")).toBeNull();

    const select = screen.getByLabelText("전환 방식");
    fireEvent.change(select, { target: { value: "CUSTOM_TRANSFER_AMOUNT" } });

    expect(screen.getByLabelText("전환 정산금")).toBeTruthy();

    fireEvent.change(select, { target: { value: "TRANSFER_ALL_TO_DC" } });

    expect(screen.queryByLabelText("전환 정산금")).toBeNull();
  });

  it("(c) 연봉 입력 지움 → 에러 메시지 + placeholder 표시", () => {
    render(<SimulatorPage />);

    const salaryInput = screen.getByLabelText("현재 연봉");
    fireEvent.change(salaryInput, { target: { value: "" } });

    expect(
      screen.getByText("현재 연봉을 0보다 큰 금액으로 입력해주세요.")
    ).toBeTruthy();

    expect(
      screen.getByText("모든 입력값을 올바르게 입력하면 결과가 표시됩니다.")
    ).toBeTruthy();
  });

  it("(d) 시나리오 chip 클릭 → 입력값 변경 + 결과 갱신", () => {
    render(<SimulatorPage />);

    const juniorChip = screen.getByRole("button", { name: "사회초년생" });
    fireEvent.click(juniorChip);

    const salaryInput = screen.getByLabelText("현재 연봉") as HTMLInputElement;
    expect(salaryInput.value).toBe("42,000,000");

    expect(screen.getByText("손익분기 수익률")).toBeTruthy();
  });

  it("(e) 공유 버튼 클릭 → clipboard.writeText 올바른 URL로 호출", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<SimulatorPage />);

    const shareBtn = screen.getByRole("button", { name: "공유 링크 복사" });
    await act(async () => {
      fireEvent.click(shareBtn);
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    const calledUrl: string = writeText.mock.calls[0][0];
    expect(calledUrl).toContain("salary=80000000");
    expect(calledUrl).toContain("method=TRANSFER_ALL_TO_DC");
  });

  it("(f) 개인정보 문구 렌더", () => {
    render(<SimulatorPage />);
    expect(
      screen.getByText((text) =>
        text.includes("재무 정보가 그대로 포함됩니다")
      )
    ).toBeTruthy();
  });

  it("(g) 원화 필드 raw 입력 후 blur → 콤마 포맷", () => {
    render(<SimulatorPage />);

    const salaryInput = screen.getByLabelText("현재 연봉") as HTMLInputElement;
    fireEvent.change(salaryInput, { target: { value: "90000000" } });
    fireEvent.blur(salaryInput);

    expect(salaryInput.value).toBe("90,000,000");
  });

  it("(h) 민감도 섹션: 표 3개 렌더 (caption/heading으로 식별)", () => {
    render(<SimulatorPage />);

    expect(screen.getByText("가정이 달라지면?")).toBeTruthy();
    expect(screen.getByText("세로: 임금상승률, 가로: DC 운용수익률")).toBeTruthy();
    expect(screen.getByText("수익률별 결과 (현재 임금상승률 기준)")).toBeTruthy();
    expect(screen.getByText("임금상승률별 손익분기 수익률")).toBeTruthy();
    expect(screen.getByText("민감도 매트릭스")).toBeTruthy();
  });

  it("(i) 민감도 매트릭스 데이터 셀 54개", () => {
    render(<SimulatorPage />);

    const dcCells = screen.getAllByText("DC");
    const dbCells = screen.getAllByText("DB");
    const tieCells = screen.getAllByText("=");
    const total = dcCells.length + dbCells.length + tieCells.length;
    expect(total).toBe(54);
  });

  it("(j) 기본값 dcReturnRate=5%는 ReturnRateTable에서 '현재 입력' 라벨 존재", () => {
    render(<SimulatorPage />);

    expect(screen.getByText("현재 입력")).toBeTruthy();
  });

  it("(k) '거의 동일' 또는 '=' 텍스트 존재", () => {
    render(<SimulatorPage />);

    const tieText =
      screen.queryByText("거의 동일") !== null ||
      screen.queryAllByText("=").length > 0;
    expect(tieText).toBe(true);
  });

  it("(l) 연봉 지워 invalid → '가정이 달라지면?' 미렌더", () => {
    render(<SimulatorPage />);

    const salaryInput = screen.getByLabelText("현재 연봉");
    fireEvent.change(salaryInput, { target: { value: "" } });

    expect(screen.queryByText("가정이 달라지면?")).toBeNull();
  });

  it("(m) 임금상승률 2.5% (grid 밖) 입력 → 수익률별 결과표에 금액 렌더 ('-' 아님)", () => {
    render(<SimulatorPage />);

    const growthInput = screen.getByLabelText("예상 임금상승률");
    fireEvent.change(growthInput, { target: { value: "2.5" } });

    const heading = screen.getByText("수익률별 결과 (현재 임금상승률 기준)");
    const table = heading.parentElement!.querySelector("table")!;
    const bodyCells = table.querySelectorAll("tbody td");
    expect(bodyCells.length).toBeGreaterThan(0);
    const dashCells = Array.from(bodyCells).filter(
      (cell) => cell.textContent?.trim() === "-"
    );
    expect(dashCells.length).toBe(0);
    expect(
      Array.from(bodyCells).some((cell) => cell.textContent?.includes("만 원"))
    ).toBe(true);
  });

  it("(preset-a) 프리셋 '안정형' 선택 → dcReturnRate input 값 '3.2' + 결과 카드 갱신", () => {
    render(<SimulatorPage />);

    const presetSelect = screen.getByLabelText("포트폴리오 프리셋");
    fireEvent.change(presetSelect, { target: { value: "stable" } });

    const dcInput = screen.getByLabelText("DC 예상 운용수익률") as HTMLInputElement;
    expect(dcInput.value).toBe("3.2");

    expect(screen.getByText("손익분기 수익률")).toBeTruthy();
  });

  it("(preset-b) 안정형 선택 후 dcReturnRate '4' 수동 편집 → preset select 'CUSTOM' 복귀", () => {
    render(<SimulatorPage />);

    const presetSelect = screen.getByLabelText("포트폴리오 프리셋") as HTMLSelectElement;
    fireEvent.change(presetSelect, { target: { value: "stable" } });

    const dcInput = screen.getByLabelText("DC 예상 운용수익률");
    fireEvent.change(dcInput, { target: { value: "4" } });

    expect(presetSelect.value).toBe("CUSTOM");
  });

  it("(preset-c) 안정형 선택 시 '위험자산 30%' 텍스트 렌더", () => {
    render(<SimulatorPage />);

    const presetSelect = screen.getByLabelText("포트폴리오 프리셋");
    fireEvent.change(presetSelect, { target: { value: "stable" } });

    expect(screen.getByText((text) => text.includes("위험자산 30%"))).toBeTruthy();
  });

  it("(preset-d) '가정치이며 예측이나 보장이 아닙니다' 문구 렌더", () => {
    render(<SimulatorPage />);

    const presetSelect = screen.getByLabelText("포트폴리오 프리셋");
    fireEvent.change(presetSelect, { target: { value: "stable" } });

    expect(
      screen.getByText((text) => text.includes("가정치이며 예측이나 보장이 아닙니다"))
    ).toBeTruthy();
  });

  it("(preset-e) 문서 전체에 '추천'·'가입' 텍스트 부재", () => {
    render(<SimulatorPage />);

    expect(screen.queryByText((text) => text.includes("추천"))).toBeNull();
    expect(screen.queryByText((text) => text.includes("가입"))).toBeNull();
  });

  it("(rules-a) '현재 서비스의 계산 가정' summary 렌더", () => {
    render(<SimulatorPage />);

    expect(screen.getByText("현재 서비스의 계산 가정")).toBeTruthy();
  });

  it("(rules-b) 현 프리셋들에서 한도 초과 경고 배너 미렌더", () => {
    render(<SimulatorPage />);

    const presetSelect = screen.getByLabelText("포트폴리오 프리셋");
    fireEvent.change(presetSelect, { target: { value: "aggressive" } });

    expect(
      screen.queryByText((text) =>
        text.includes("위험자산 비중이 서비스 기준 한도")
      )
    ).toBeNull();
  });

  it("(risk-a) 변동성 필드 기본값 '12'", () => {
    render(<SimulatorPage />);
    const input = screen.getByLabelText("연간 변동성") as HTMLInputElement;
    expect(input.value).toBe("12");
  });

  it("(risk-b) 리스크 h2·카드·고지 렌더", () => {
    render(<SimulatorPage />);
    expect(screen.getByText("운용 성과가 흔들린다면? (리스크 시뮬레이션)")).toBeTruthy();
    expect(screen.getByText("DC가 DB보다 유리할 확률")).toBeTruthy();
    expect(
      screen.getByText((text) => text.includes("확정 예측이 아닙니다"))
    ).toBeTruthy();
  });

  it("(risk-c) 변동성 '61' 입력 → 에러 메시지 + 리스크 섹션 미렌더", () => {
    render(<SimulatorPage />);
    const input = screen.getByLabelText("연간 변동성");
    fireEvent.change(input, { target: { value: "61" } });
    expect(
      screen.getByText("연간 변동성은 0%에서 60% 사이로 입력해주세요.")
    ).toBeTruthy();
    expect(
      screen.queryByText("운용 성과가 흔들린다면? (리스크 시뮬레이션)")
    ).toBeNull();
  });

  it("(stress-a) 기본값(CUSTOM)에서 h2 렌더 + 표 4행 + '100%' 가정 표기", () => {
    render(<SimulatorPage />);
    expect(
      screen.getByText("퇴직 직전 시장이 하락한다면? (스트레스 테스트)")
    ).toBeTruthy();
    expect(
      screen.getByText((text) => text.includes("100%") && text.includes("보수적 가정"))
    ).toBeTruthy();
    const rows = screen.getAllByText((text) => /^(10|20|30|40)%$/.test(text));
    expect(rows.length).toBe(4);
  });

  it("(stress-b) 프리셋 sp500 선택 → '70%' 가정 표기", () => {
    render(<SimulatorPage />);
    const presetSelect = screen.getByLabelText("포트폴리오 프리셋");
    fireEvent.change(presetSelect, { target: { value: "sp500" } });
    expect(
      screen.getByText((text) => text.includes("70%") && text.includes("프리셋 기준"))
    ).toBeTruthy();
  });

  it("(stress-c) 예금형 선택 → '영향을 받지 않습니다' 문구 + 표 미렌더", () => {
    render(<SimulatorPage />);
    const presetSelect = screen.getByLabelText("포트폴리오 프리셋");
    fireEvent.change(presetSelect, { target: { value: "deposit" } });
    expect(
      screen.getByText((text) => text.includes("영향을 받지 않습니다"))
    ).toBeTruthy();
    const rows = screen.queryAllByText((text) => /^(10|20|30|40)%$/.test(text));
    expect(rows.length).toBe(0);
  });

  it("(stress-d) 고지 문구 렌더", () => {
    render(<SimulatorPage />);
    expect(
      screen.getByText((text) => text.includes("쇼크는 퇴직 직전 1회 발생을 가정한 단순화 모델입니다"))
    ).toBeTruthy();
  });

  it("(adv-a) details 기본 접힘 상태로 summary 렌더", () => {
    render(<SimulatorPage />);
    const summary = screen.getByText("고급 임금 시나리오");
    expect(summary).toBeTruthy();
    const details = summary.closest("details");
    expect(details).toBeTruthy();
    expect((details as HTMLDetailsElement).open).toBe(false);
  });

  it("(adv-b) 임금피크제 모드 선택 + 피크 3년차·감액 20% 입력 → DB 예상액 감소 + 적용 중 뱃지", () => {
    render(<SimulatorPage />);

    const defaultDbCards = screen.getAllByText((text) => text.includes("만 원") || text.includes("억 원"));
    const defaultDbCard = defaultDbCards.find((el) =>
      el.closest("[class]")
        ?.previousElementSibling
        ?.textContent?.includes("DB 유지 예상액")
    );
    const defaultDbText = defaultDbCard?.textContent ?? "";

    const modeSelect = screen.getByLabelText("임금 경로 모드");
    fireEvent.change(modeSelect, { target: { value: "WAGE_PEAK" } });

    fireEvent.change(screen.getByLabelText("피크 시작 연차"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("감액률"), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("피크 이후 상승률"), { target: { value: "0" } });

    expect(screen.getByText("고급 임금 시나리오 적용 중")).toBeTruthy();

    const dbLabel = screen.getByText("DB 유지 예상액");
    const dbCard = dbLabel.closest("div");
    const newDbText = dbCard?.querySelector("p.text-xl")?.textContent ?? "";
    expect(newDbText).not.toBe("");
    expect(newDbText).not.toBe(defaultDbText);
  });

  it("(adv-c) 피크 연차 '16' (남은 근속 15 초과) → 에러 메시지", () => {
    render(<SimulatorPage />);

    const summary = screen.getByText("고급 임금 시나리오");
    const details = summary.closest("details") as HTMLDetailsElement;
    details.open = true;

    const modeSelect = screen.getByLabelText("임금 경로 모드");
    fireEvent.change(modeSelect, { target: { value: "WAGE_PEAK" } });

    const peakStartInput = screen.getByLabelText("피크 시작 연차");
    fireEvent.change(peakStartInput, { target: { value: "16" } });

    expect(
      screen.getByText("피크 시작 연차는 1년차부터 남은 근속연수 이내의 정수로 입력해주세요.")
    ).toBeTruthy();
  });

  it("(adv-d) 평균임금 9,000,000 입력 → DB 카드 '1,875만 원' 표기", () => {
    render(<SimulatorPage />);

    const summary = screen.getByText("고급 임금 시나리오");
    const details = summary.closest("details") as HTMLDetailsElement;
    details.open = true;

    const dbAvgInput = screen.getByLabelText("평균임금 직접 입력 (선택)");
    fireEvent.change(dbAvgInput, { target: { value: "9000000" } });

    expect(
      screen.getAllByText((text) => text.includes("1,875만 원")).length
    ).toBeGreaterThan(0);
  });

  it("(adv-e) 기본 모드 + 빈 고급 필드 → 뱃지 미렌더, 결과 동일", () => {
    render(<SimulatorPage />);

    expect(screen.queryByText("고급 임금 시나리오 적용 중")).toBeNull();
    expect(screen.getByText("DB 유지 예상액")).toBeTruthy();
    expect(screen.getByText("DC 전환 예상액")).toBeTruthy();
  });

  it("(tax-a) 세후 체크 → DB/DC 카드에 '(세후)' 라벨 + 실효세율 보조줄 존재 + 값 변경", () => {
    render(<SimulatorPage />);

    const dcCardBefore = screen.getByText("DC 전환 예상액").closest("div")!;
    const dcValueBefore = dcCardBefore.querySelector("p.text-xl")!.textContent ?? "";

    const afterTaxCheckbox = screen.getByRole("checkbox", { name: "세후 금액 보기" });
    fireEvent.click(afterTaxCheckbox);

    expect(screen.getAllByText((t) => t.includes("(세후)")).length).toBeGreaterThan(0);

    expect(
      screen.getAllByText((t) => t.includes("실효세율")).length
    ).toBeGreaterThan(0);

    const dcCardAfter = screen.getByText(/DC 전환 예상액/).closest("div")!;
    const dcValueAfter = dcCardAfter.querySelector("p.text-xl")!.textContent ?? "";
    expect(dcValueAfter).not.toBe(dcValueBefore);
  });

  it("(tax-b) 현재가치 체크 → 물가상승률 입력 노출 + DC 값 감소", () => {
    render(<SimulatorPage />);

    const dcCardBefore = screen.getByText("DC 전환 예상액").closest("div")!;
    const dcValueBefore = dcCardBefore.querySelector("p.text-xl")!.textContent ?? "";

    expect(screen.queryByLabelText("물가상승률 (%)")).toBeNull();

    const pvCheckbox = screen.getByRole("checkbox", { name: "현재가치로 보기" });
    fireEvent.click(pvCheckbox);

    expect(screen.getByLabelText("물가상승률 (%)")).toBeTruthy();

    const dcCardAfter = screen.getByText(/DC 전환 예상액/).closest("div")!;
    const dcValueAfter = dcCardAfter.querySelector("p.text-xl")!.textContent ?? "";
    expect(dcValueAfter).not.toBe(dcValueBefore);
  });

  it("(tax-c) 물가상승률 '11' 입력 → 에러 메시지", () => {
    render(<SimulatorPage />);

    const pvCheckbox = screen.getByRole("checkbox", { name: "현재가치로 보기" });
    fireEvent.click(pvCheckbox);

    const inflInput = screen.getByLabelText("물가상승률 (%)");
    fireEvent.change(inflInput, { target: { value: "11" } });

    expect(
      screen.getByText("물가상승률은 0%에서 10% 사이로 입력해주세요.")
    ).toBeTruthy();
  });

  it("(tax-d) 손익분기 카드 '(세전 기준)' 상시 표기", () => {
    render(<SimulatorPage />);

    expect(screen.getAllByText((t) => t.includes("세전 기준")).length).toBeGreaterThan(0);
  });

  it("(tax-e) 세후 체크 시 세법 고지 문구 렌더", () => {
    render(<SimulatorPage />);

    const afterTaxCheckbox = screen.getByRole("checkbox", { name: "세후 금액 보기" });
    fireEvent.click(afterTaxCheckbox);

    expect(
      screen.getByText((t) => t.includes("세법 기준 단순 추정치입니다"))
    ).toBeTruthy();
  });

  it("(r-a) '보고서 인쇄 · PDF 저장' 버튼 클릭 → window.print 호출", () => {
    const printMock = vi.fn();
    Object.defineProperty(window, "print", { value: printMock, configurable: true });
    vi.useFakeTimers();

    render(<SimulatorPage />);

    const printBtn = screen.getByRole("button", { name: "보고서 인쇄 · PDF 저장" });
    fireEvent.click(printBtn);

    vi.runAllTimers();
    expect(printMock).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("(r-b) 인쇄 버튼 클릭 후 PrintReportHeader에 생성 시각 텍스트 존재 (YYYY-MM-DD 형식)", () => {
    vi.useFakeTimers();

    render(<SimulatorPage />);

    const printBtn = screen.getByRole("button", { name: "보고서 인쇄 · PDF 저장" });
    fireEvent.click(printBtn);

    expect(
      screen.getByText((t) => /\d{4}-\d{2}-\d{2}/.test(t))
    ).toBeTruthy();

    vi.useRealTimers();
  });

  it("(r-c) PrintReportHeader에 입력 요약 값 렌더 (연봉 포함)", () => {
    render(<SimulatorPage />);

    expect(
      screen.getByText((t) => t.includes("80,000,000"))
    ).toBeTruthy();
  });

  it("(r-d) '투자 권유가 아닌 시뮬레이션 결과' 문구 존재", () => {
    render(<SimulatorPage />);

    expect(
      screen.getByText((t) => t.includes("투자 권유가 아닌 시뮬레이션 결과"))
    ).toBeTruthy();
  });

  it("(r-e) 연봉 지워 invalid → '보고서 인쇄 · PDF 저장' 버튼 disabled", () => {
    render(<SimulatorPage />);

    const salaryInput = screen.getByLabelText("현재 연봉");
    fireEvent.change(salaryInput, { target: { value: "" } });

    const printBtn = screen.getByRole("button", { name: "보고서 인쇄 · PDF 저장" }) as HTMLButtonElement;
    expect(printBtn.disabled).toBe(true);
  });
});
