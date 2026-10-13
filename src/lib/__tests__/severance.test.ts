import { describe, it, expect } from "vitest";
import { serviceYears, serviceDeduction, convertedDeduction, severanceTax, pensionReceiptRatio, severancePay, averageDailyWage } from "../severance";

describe("근속연수공제", () => {
  it("5년 이하 100만원씩", () => expect(serviceDeduction(3)).toBe(3_000_000));
  it("10년 = 500만원 + 200만원 × 5", () => expect(serviceDeduction(10)).toBe(15_000_000));
  it("20년 = 1,500만원 + 250만원 × 10", () => expect(serviceDeduction(20)).toBe(40_000_000));
  it("25년 = 4,000만원 + 300만원 × 5", () => expect(serviceDeduction(25)).toBe(55_000_000));
  it("1년 미만 끝수는 1년으로", () => {
    expect(serviceYears(9.1)).toBe(10);
    expect(serviceYears(0.5)).toBe(1);
    expect(serviceYears(10)).toBe(10);
  });
});

describe("환산급여공제", () => {
  it("800만원 이하 전액", () => expect(convertedDeduction(5_000_000)).toBe(5_000_000));
  it("7천만원 = 800만원 + 6,200만원 × 60%", () => expect(convertedDeduction(70_000_000)).toBe(45_200_000));
  it("1억원 = 4,520만원 + 3천만원 × 55%", () => expect(convertedDeduction(100_000_000)).toBe(61_700_000));
  it("3억원 = 6,170만원 + 2억원 × 45%", () => expect(convertedDeduction(300_000_000)).toBe(151_700_000));
  it("표 경계가 이어진다", () => {
    for (const b of [8_000_000, 70_000_000, 100_000_000, 300_000_000]) expect(convertedDeduction(b + 1) - convertedDeduction(b)).toBeLessThanOrEqual(1);
  });
});

describe("severanceTax", () => {
  it("퇴직금 1억원·10년 → 과세표준 3,940만원, 소득세 3,875,000원", () => {
    const x = severanceTax(100_000_000, 10);
    expect(x.serviceDeduction).toBe(15_000_000);
    expect(x.converted).toBe(102_000_000);
    expect(x.convertedDeduction).toBe(62_600_000);
    expect(x.base).toBe(39_400_000);
    expect(x.tax).toBe(3_875_000);
    expect(x.local).toBe(387_500);
  });
  it("근속연수공제가 퇴직금보다 크면 세금 0", () => expect(severanceTax(3_000_000, 5).tax).toBe(0));
  it("오래 일할수록 같은 금액의 세금이 줄어든다", () => expect(severanceTax(100_000_000, 20).tax).toBeLessThan(severanceTax(100_000_000, 10).tax));
});

it("연금수령 비율 70%·60%·50%", () => {
  expect(pensionReceiptRatio(1)).toBe(0.7);
  expect(pensionReceiptRatio(10)).toBe(0.7);
  expect(pensionReceiptRatio(11)).toBe(0.6);
  expect(pensionReceiptRatio(21)).toBe(0.5);
});

it("퇴직금 = 평균임금 × 30일 × 근속연수", () => {
  const w = averageDailyWage(9_000_000, 92);
  expect(severancePay(w, 10)).toBe(Math.floor((9_000_000 / 92) * 30 * 10));
});
