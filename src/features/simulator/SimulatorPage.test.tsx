// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
});
