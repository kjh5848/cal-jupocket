/** 퍼센트 계산기 — 경계값과 반올림(부동소수 오차) 고정. 법 숫자 없음, 손으로 셈한 값. */
import { describe, it, expect } from "vitest";
import { round2, parseNumber, formatNumber, ratio, percentOf, change, adjust, original } from "../percent";

describe("round2", () => {
  it("부동소수로 .xx4999… 가 된 반 올림 값을 올린다", () => {
    expect(round2(12345 * 0.333)).toBe(4110.89); // 4,110.885
    expect(round2((7 * 12.5) / 100)).toBe(0.88); // 0.875
    expect(round2(1.005)).toBe(1.01);
  });
  it("음수는 0에서 먼 쪽으로", () => {
    expect(round2(-0.875)).toBe(-0.88);
    expect(round2(-0.001)).toBe(0);
  });
});

describe("parseNumber · formatNumber", () => {
  it("쉼표·% 를 지우고 읽는다", () => {
    expect(parseNumber("12,345")).toBe(12345);
    expect(parseNumber("33.3%")).toBe(33.3);
    expect(parseNumber("-250")).toBe(-250);
    expect(Number.isNaN(parseNumber(""))).toBe(true);
    expect(Number.isNaN(parseNumber("1a"))).toBe(true);
  });
  it("천 단위 쉼표, 소수 둘째 자리까지", () => {
    expect(formatNumber(4110.885)).toBe("4,110.89");
    expect(formatNumber(40000)).toBe("40,000");
    expect(formatNumber(33.333333)).toBe("33.33");
  });
});

describe("비율 — B 는 A 의 몇 %", () => {
  it("200 중 50 → 25%, 3 중 1 → 33.33%", () => {
    expect(ratio(200, 50)).toBe(25);
    expect(ratio(3, 1)).toBe(33.33);
  });
  it("기준 0 은 계산하지 않는다", () => {
    expect(ratio(0, 5)).toBeNull();
  });
});

describe("A 의 B%", () => {
  it("80,000 의 15% → 12,000 · 7 의 12.5% → 0.88 · 1,000 의 0.1% → 1", () => {
    expect(percentOf(80000, 15)).toBe(12000);
    expect(percentOf(7, 12.5)).toBe(0.88);
    expect(percentOf(1000, 0.1)).toBe(1);
  });
});

describe("변화율", () => {
  it("100 → 120 은 +20%, 250 → 200 은 −20%", () => {
    expect(change(100, 120)).toEqual({ rate: 20, diff: 20 });
    expect(change(250, 200)).toEqual({ rate: -20, diff: -50 });
  });
  it("기준이 음수면 절댓값으로 나눈다 — −100 → −50 은 +50%", () => {
    expect(change(-100, -50)).toEqual({ rate: 50, diff: 50 });
  });
  it("기준 0 은 null", () => {
    expect(change(0, 5)).toBeNull();
  });
});

describe("올리기·내리기", () => {
  it("50,000 원을 20% 내리면 40,000 (할인 10,000)", () => {
    expect(adjust(50000, 20, "down")).toEqual({ result: 40000, amount: 10000 });
  });
  it("12,345 를 33.3% 내리면 8,234.12 (할인 4,110.89)", () => {
    expect(adjust(12345, 33.3, "down")).toEqual({ result: 8234.12, amount: 4110.89 });
  });
  it("10,000 을 10% 올리면 11,000, 0% 는 그대로", () => {
    expect(adjust(10000, 10, "up")).toEqual({ result: 11000, amount: 1000 });
    expect(adjust(100, 0, "down")).toEqual({ result: 100, amount: 0 });
  });
});

describe("원래 값 역산", () => {
  it("20% 할인해 40,000 이면 원래 50,000", () => {
    expect(original(40000, 20, "down")).toEqual({ base: 50000, amount: -10000 });
  });
  it("10% 올라 11,000 이면 원래 10,000 · 10% 올라 10,000 이면 9,090.91", () => {
    expect(original(11000, 10, "up")).toEqual({ base: 10000, amount: 1000 });
    expect(original(10000, 10, "up")).toEqual({ base: 9090.91, amount: 909.09 });
  });
  it("100% 내린 값에서는 원래 값을 알 수 없다", () => {
    expect(original(0, 100, "down")).toBeNull();
  });
});
