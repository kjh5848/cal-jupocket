/**
 * 영국 VAT — GOV.UK VAT rates(20%·5%) · HMRC Notice 700 7.3.1(VAT fraction 1/6·1/21, £2.40 → 40p) · 17.5/17.6(끝수).
 * 끝수는 손계산으로 고정: £10.99 × 20% = 219.8p / £10.00 gross ÷ 6 = 166.66…p / £3.33 × 5% = 16.65p / £1.00 gross × 5/105 = 4.76…p.
 */
import { describe, it, expect } from "vitest";
import { fromNet, fromGross, parsePence, gbp, poundsInput, STANDARD, REDUCED } from "../gb/vat";

describe("세율 (gov.uk/vat-rates 2026-10-21)", () => {
  it("standard 20% · reduced 5%", () => {
    expect(STANDARD).toBe(20);
    expect(REDUCED).toBe(5);
  });
});

describe("gross → VAT (VAT fraction)", () => {
  it("Notice 700 7.3.1 예시: £2.40(20%) → VAT 40p, net £2.00", () => {
    expect(fromGross(240, 20)).toEqual({ net: 200, vat: 40, gross: 240 });
  });
  it("£120 → VAT £20 (1/6), £105(5%) → VAT £5 (1/21)", () => {
    expect(fromGross(12000, 20)).toEqual({ net: 10000, vat: 2000, gross: 12000 });
    expect(fromGross(10500, 5)).toEqual({ net: 10000, vat: 500, gross: 10500 });
  });
  it("£10.00(20%): 166.66…p → nearest 167p · down 166p", () => {
    expect(fromGross(1000, 20, "nearest")).toEqual({ net: 833, vat: 167, gross: 1000 });
    expect(fromGross(1000, 20, "down")).toEqual({ net: 834, vat: 166, gross: 1000 });
  });
  it("£1.00(5%): 4.76…p → nearest 5p · down 4p", () => {
    expect(fromGross(100, 5, "nearest").vat).toBe(5);
    expect(fromGross(100, 5, "down").vat).toBe(4);
  });
});

describe("net → gross", () => {
  it("£100 → £120 (20%) · £105 (5%)", () => {
    expect(fromNet(10000, 20)).toEqual({ net: 10000, vat: 2000, gross: 12000 });
    expect(fromNet(10000, 5)).toEqual({ net: 10000, vat: 500, gross: 10500 });
  });
  it("£10.99 × 20% = 219.8p → nearest 220p · down 219p", () => {
    expect(fromNet(1099, 20, "nearest").vat).toBe(220);
    expect(fromNet(1099, 20, "down").vat).toBe(219);
  });
  it("반 펜스 경계: £3.33 × 5% = 16.65p → nearest 17p · down 16p", () => {
    expect(fromNet(333, 5, "nearest").vat).toBe(17);
    expect(fromNet(333, 5, "down").vat).toBe(16);
  });
  it("0 은 0", () => {
    expect(fromNet(0, 20)).toEqual({ net: 0, vat: 0, gross: 0 });
    expect(fromGross(0, 5)).toEqual({ net: 0, vat: 0, gross: 0 });
  });
  it("왕복: net → gross → net 은 nearest 에서 1p 안", () => {
    for (let net = 0; net <= 5000; net += 7) {
      for (const rate of [20, 5] as const) {
        const g = fromNet(net, rate).gross;
        expect(Math.abs(fromGross(g, rate).net - net)).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("입력·표기", () => {
  it("parsePence", () => {
    expect(parsePence("£1,234.56")).toBe(123456);
    expect(parsePence("2.4")).toBe(240);
    expect(parsePence("1.005")).toBe(101);
    expect(parsePence("1.004")).toBe(100);
    expect(parsePence(".5")).toBe(50);
    expect(parsePence(" 12 ")).toBe(1200);
    expect(parsePence("")).toBe(0);
    expect(parsePence("abc")).toBe(0);
    expect(parsePence("1.2.3")).toBe(0);
  });
  it("gbp · poundsInput", () => {
    expect(gbp(123456)).toBe("£1,234.56");
    expect(gbp(40)).toBe("£0.40");
    expect(poundsInput(100000)).toBe("1,000.00");
  });
});
