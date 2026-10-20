/** 퍼센트 계산기 — 경계값과 반올림(부동소수 오차) 고정. 법 숫자 없음, 손으로 셈한 값. */
import { describe, it, expect } from "vitest";
import { round2, parseNumber, formatNumber, parseNumberDe, formatNumberDe, ratio, percentOf, change, adjust, original, toWari, bpToPct, pctToBp, rateShift, formatFine } from "../percent";

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

describe("parseNumberDe · formatNumberDe (독일어판 — 소수 쉼표)", () => {
  it("쉼표는 소수점", () => {
    expect(parseNumberDe("12,5")).toBe(12.5);
    expect(parseNumberDe("-3,5")).toBe(-3.5);
    expect(parseNumberDe("20 %")).toBe(20);
    expect(parseNumberDe("0,75")).toBe(0.75);
  });
  it("천 단위 점·공백은 지운다", () => {
    expect(parseNumberDe("1.234,5")).toBe(1234.5);
    expect(parseNumberDe("1.500")).toBe(1500);
    expect(parseNumberDe("12 348")).toBe(12348);
    expect(parseNumberDe("12 348,50")).toBe(12348.5);
  });
  it("세 자리 묶음이 아닌 점은 소수점", () => {
    expect(parseNumberDe("12.5")).toBe(12.5);
    expect(parseNumberDe("1.5")).toBe(1.5);
  });
  it("못 읽는 입력은 NaN", () => {
    expect(Number.isNaN(parseNumberDe("1,2,3"))).toBe(true);
    expect(Number.isNaN(parseNumberDe("1.23,4"))).toBe(true);
    expect(Number.isNaN(parseNumberDe(""))).toBe(true);
    expect(Number.isNaN(parseNumberDe("12a"))).toBe(true);
  });
  it("소수 쉼표, 천 단위 공백(줄바꿈 없는 공백), 소수 둘째 자리까지", () => {
    expect(formatNumberDe(4110.885)).toBe("4 110,89");
    expect(formatNumberDe(40000)).toBe("40 000");
    expect(formatNumberDe(33.333333)).toBe("33,33");
    expect(formatNumberDe(-9.09)).toBe("-9,09");
    expect(formatNumberDe(25)).toBe("25");
    expect(formatNumberDe(1234567.5)).toBe("1 234 567,5");
  });
  it("한국어판 표기는 그대로", () => {
    expect(formatNumber(1234567.5)).toBe("1,234,567.5");
    expect(parseNumber("12,5")).toBe(125);
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

describe("일본어판 — 전각 입력 · 歩合(割·分·厘)", () => {
  it("전각 숫자·％ 를 읽는다", () => {
    expect(parseNumber("２０％")).toBe(20);
    expect(parseNumber("１，２００")).toBe(1200);
  });
  it("10% = 1割, 1% = 1分, 0.1% = 1厘", () => {
    expect(toWari(30)).toBe("3割");
    expect(toWari(25)).toBe("2割5分");
    expect(toWari(12.5)).toBe("1割2分5厘");
    expect(toWari(0.5)).toBe("5厘");
    expect(toWari(100)).toBe("10割");
  });
  it("0 이하·100 초과·소수 둘째 자리 이하는 쓰지 않는다", () => {
    expect(toWari(0)).toBeNull();
    expect(toWari(120)).toBeNull();
    expect(toWari(33.33)).toBeNull();
  });
});

describe("bp ↔ %p (#155, 1bp = 0.01%p — SEC Investor.gov 용어집)", () => {
  it("bp → %p", () => {
    expect(bpToPct(25)).toBe(0.25);
    expect(bpToPct(1)).toBe(0.01);
    expect(bpToPct(12.5)).toBe(0.125);
    expect(bpToPct(-25)).toBe(-0.25);
    expect(bpToPct(800)).toBe(8); // 용어집 예: 8% = 800bp
    expect(bpToPct(0.5)).toBe(0.005);
  });
  it("%p → bp", () => {
    expect(pctToBp(0.25)).toBe(25);
    expect(pctToBp(0.375)).toBe(37.5);
    expect(pctToBp(0.07)).toBe(7); // 0.07 × 100 = 7.000000000000001 을 끊는다
    expect(pctToBp(8)).toBe(800);
  });
  it("금리 이동 — roberin 대조와 같은 입력", () => {
    expect(rateShift(3.5, 25, 100_000_000)).toEqual({ after: 3.75, relative: 7.14, yearly: 250_000 });
    expect(rateShift(4, -25, 300_000_000)).toEqual({ after: 3.75, relative: -6.25, yearly: -750_000 });
    expect(rateShift(0.5, 1, 10_000_000)).toEqual({ after: 0.51, relative: 2, yearly: 1_000 });
    expect(rateShift(3, 12.5, 150_000_000)).toEqual({ after: 3.125, relative: 4.17, yearly: 187_500 });
  });
  it("처음 금리 0 이면 상대 변화율 없음, 원금 없으면 이자 차이 없음, 원 미만 반올림", () => {
    expect(rateShift(0, 25)).toEqual({ after: 0.25, relative: null, yearly: null });
    expect(rateShift(3, 1, 12_345)).toEqual({ after: 3.01, relative: 0.33, yearly: 1 }); // 1.2345원
    expect(rateShift(3, -1, 15_000)).toEqual({ after: 2.99, relative: -0.33, yearly: -2 }); // −1.5원 → −2
  });
  it("표기", () => {
    expect(formatFine(0.125)).toBe("0.125");
    expect(formatFine(37.5)).toBe("37.5");
    expect(formatFine(250000)).toBe("250,000");
  });
});
