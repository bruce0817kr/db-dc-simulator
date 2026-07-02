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
});
