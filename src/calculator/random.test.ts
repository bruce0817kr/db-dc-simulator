// @vitest-environment node
import { describe, it, expect } from "vitest";
import { mulberry32, createNormalSampler } from "./random";

describe("mulberry32", () => {
  it("같은 seed로 생성한 첫 10개 값이 동일", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b());
    }
  });

  it("다른 seed는 첫 값이 상이", () => {
    const a = mulberry32(42);
    const b = mulberry32(43);
    expect(a()).not.toBe(b());
  });

  it("값이 [0, 1) 범위", () => {
    const rand = mulberry32(1234);
    for (let i = 0; i < 1000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("createNormalSampler", () => {
  it("10,000개 평균 |m| < 0.05", () => {
    const sample = createNormalSampler(42);
    let sum = 0;
    const n = 10000;
    for (let i = 0; i < n; i++) sum += sample();
    expect(Math.abs(sum / n)).toBeLessThan(0.05);
  });

  it("10,000개 표준편차 0.95 ~ 1.05", () => {
    const sample = createNormalSampler(42);
    const values: number[] = [];
    for (let i = 0; i < 10000; i++) values.push(sample());
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    expect(std).toBeGreaterThan(0.95);
    expect(std).toBeLessThan(1.05);
  });
});
