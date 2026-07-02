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
});
