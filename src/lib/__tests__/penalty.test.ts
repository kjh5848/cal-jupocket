/**
 * 가산세는 이 사이트에서 가장 조심해야 할 숫자다.
 *
 * "신고 안 하면 얼마 물어요" 를 잘못 말하면 사람이 실제로 손해를 본다.
 * 그래서 rates 파일의 값이 국세기본법 원문과 같은지부터 본다 — 코드가
 * 아니라 데이터가 틀리는 쪽이 더 조용하고 더 위험하다.
 */
import { describe, it, expect } from "vitest";
import {
  computeLateFiling,
  lateFilingRelief,
  daysUntilReliefDrops,
  penaltyRates as r,
} from "../penalty";

describe("원문과 대조 — 국세기본법 [시행 2026. 8. 11.]", () => {
  it("무신고가산세: 일반 20% · 부정행위 40% · 역외 60% (제47조의2)", () => {
    expect(r.noReport.general).toBe(0.2);
    expect(r.noReport.fraud).toBe(0.4);
    expect(r.noReport.fraudOffshore).toBe(0.6);
  });

  it("과소신고가산세: 일반 10% (제47조의3)", () => {
    expect(r.underReport.general).toBe(0.1);
    expect(r.underReport.fraud).toBe(0.4);
  });

  it("납부지연: 1일 10만분의 22 (시행령 제27조의4)", () => {
    expect(r.latePayment.dailyRate).toBe(22 / 100000);
    expect(r.latePayment.monthlyRateAfterNotice).toBe(67 / 10000);
    expect(r.latePayment.noticeSurcharge).toBe(0.03);
  });

  it("기한후신고 감면: 1개월 50% · 3개월 30% · 6개월 20% (제48조 제2항 제2호)", () => {
    expect(r.lateFilingRelief).toEqual([
      { withinMonths: 1, relief: 0.5 },
      { withinMonths: 3, relief: 0.3 },
      { withinMonths: 6, relief: 0.2 },
    ]);
  });

  it("수정신고 감면 6단계 (제48조 제2항 제1호)", () => {
    expect(r.amendedFilingRelief.map((x) => x.relief)).toEqual([
      0.9, 0.75, 0.5, 0.3, 0.2, 0.1,
    ]);
  });

  it("출처와 확인일이 붙어 있다", () => {
    expect(r.sources.length).toBeGreaterThanOrEqual(5);
    for (const s of r.sources) expect(s.url).toContain("law.go.kr");
    expect(r.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.lawVersion).toContain("2026");
  });

  it("검증하지 않은 항목을 명시해 둔다 — 나중에 그걸 쓰지 않도록", () => {
    expect(r.notVerified.length).toBeGreaterThan(0);
  });
});

describe("감면 구간", () => {
  it.each([
    [0, 0],
    [1, 0.5],
    [30, 0.5],
    [31, 0.3],
    [90, 0.3],
    [91, 0.2],
    [180, 0.2],
    [181, 0],
    [365, 0],
  ])("%i일 → 감면 %f", (days, expected) => {
    expect(lateFilingRelief(days)).toBe(expected);
  });
});

describe("기한 후 신고 가산세", () => {
  it("신고 안 한 세액 100만원, 10일 늦음", () => {
    const p = computeLateFiling({ tax: 1_000_000, daysLate: 10 });
    expect(p.noReportBase).toBe(200_000); // 20%
    expect(p.reliefRate).toBe(0.5); // 1개월 이내
    expect(p.reliefAmount).toBe(100_000);
    expect(p.noReport).toBe(100_000);
    expect(p.latePayment).toBe(2_200); // 100만 × 0.022% × 10일
    expect(p.total).toBe(102_200);
    expect(p.grandTotal).toBe(1_102_200);
  });

  it("6개월을 넘기면 무신고가산세 감면이 사라진다", () => {
    const inTime = computeLateFiling({ tax: 1_000_000, daysLate: 180 });
    const tooLate = computeLateFiling({ tax: 1_000_000, daysLate: 181 });
    expect(inTime.reliefRate).toBe(0.2);
    expect(tooLate.reliefRate).toBe(0);
    expect(tooLate.reliefExpired).toBe(true);
    expect(tooLate.noReport).toBeGreaterThan(inTime.noReport);
  });

  it("납부지연가산세는 감면되지 않는다 — 무신고가산세만 줄어든다", () => {
    const p = computeLateFiling({ tax: 1_000_000, daysLate: 10 });
    // 감면은 무신고분에만 적용됐고 납부지연분은 그대로다.
    expect(p.noReportBase - p.noReport).toBe(p.reliefAmount);
    expect(p.latePayment).toBe(Math.floor(1_000_000 * 0.00022 * 10));
  });

  it("부정행위는 40%이고 감면이 없다", () => {
    const p = computeLateFiling({ tax: 1_000_000, daysLate: 10, fraud: true });
    expect(p.noReportBase).toBe(400_000);
    expect(p.reliefRate).toBe(0);
    expect(p.noReport).toBe(400_000);
  });

  it("늦을수록 총액이 단조 증가한다", () => {
    let prev = -1;
    for (const d of [1, 15, 30, 31, 60, 90, 91, 150, 180, 181, 300, 365]) {
      const t = computeLateFiling({ tax: 3_000_000, daysLate: d }).total;
      expect(t, `${d}일`).toBeGreaterThan(prev);
      prev = t;
    }
  });

  it("0원·음수를 넣어도 터지지 않는다", () => {
    for (const tax of [0, -100]) {
      const p = computeLateFiling({ tax, daysLate: 30 });
      expect(p.total).toBe(0);
      expect(p.grandTotal).toBe(0);
    }
  });

  it("모든 값이 원 단위 정수다", () => {
    const p = computeLateFiling({ tax: 1_234_567, daysLate: 47 });
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === "number" && k !== "reliefRate") {
        expect(Number.isInteger(v), k).toBe(true);
      }
    }
  });
});

describe("다음 감면 단계까지", () => {
  it("남은 일수를 알려준다 — '지금 신고하면 아직 줄어든다'", () => {
    expect(daysUntilReliefDrops(10)).toBe(20); // 1개월(30일)까지 20일
    expect(daysUntilReliefDrops(40)).toBe(50); // 3개월(90일)까지 50일
    expect(daysUntilReliefDrops(200)).toBeNull(); // 이미 끝남
  });
});
