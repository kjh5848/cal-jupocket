import { describe, it, expect } from "vitest";
import {
  computeRefundInterest,
  noReportPenaltyOnRefund,
  decisionWithinMonths,
  correctionWithinYears,
} from "../refund";
import rates from "../../rates/refund-2026.json";

describe("국세환급가산금", () => {
  it("이자율은 rates 의 값(연 1천분의 31)을 쓴다", () => {
    expect(rates.refundInterest.annualRate).toBe(0.031);
    expect(computeRefundInterest({ refund: 1_000_000, days: 365 }).annualRate).toBe(
      0.031,
    );
  });

  it("1년이면 연이율만큼 붙는다", () => {
    const r = computeRefundInterest({ refund: 1_000_000, days: 365 });
    expect(r.interest).toBe(31_000);
    expect(r.total).toBe(1_031_000);
  });

  it("일할 계산이다 — 절반 기간이면 절반", () => {
    const full = computeRefundInterest({ refund: 2_000_000, days: 365 }).interest;
    const half = computeRefundInterest({ refund: 2_000_000, days: 182 }).interest;
    expect(half).toBeLessThan(full);
    expect(Math.abs(half - full / 2)).toBeLessThan(full * 0.01);
  });

  it("기간이 0이거나 음수면 가산금이 없다", () => {
    expect(computeRefundInterest({ refund: 1_000_000, days: 0 }).interest).toBe(0);
    expect(computeRefundInterest({ refund: 1_000_000, days: -10 }).interest).toBe(0);
  });

  it("원 단위로 버린다", () => {
    const r = computeRefundInterest({ refund: 123_456, days: 37 });
    expect(Number.isInteger(r.interest)).toBe(true);
    expect(Number.isInteger(r.total)).toBe(true);
  });
});

describe("무신고가산세의 과세표준 (제47조의2 제1항)", () => {
  it("납부할 세액이 없으면 가산세도 0이다", () => {
    expect(noReportPenaltyOnRefund(0)).toBe(0);
  });

  it("납부할 세액이 있으면 20%가 붙는다", () => {
    expect(noReportPenaltyOnRefund(1_000_000)).toBe(200_000);
  });
});

describe("법정 기한", () => {
  it("기한 후 신고 뒤 결정·통지는 3개월 이내", () => {
    expect(decisionWithinMonths).toBe(3);
  });

  it("경정청구는 5년 이내", () => {
    expect(correctionWithinYears).toBe(5);
  });
});

describe("rates 파일 자체", () => {
  it("검증일과 출처가 있다", () => {
    expect(rates.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(rates.sources.length).toBeGreaterThan(0);
    for (const s of rates.sources) {
      expect(s.url).toContain("law.go.kr");
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});
