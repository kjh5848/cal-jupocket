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
  periodEnd,
  addDays,
  penaltyRates as r,
} from "../penalty";

/** 2025년 귀속 종합소득세 기한 — 5월 31일이 일요일이라 6월 1일(국세기본법 제5조). */
const D = "2026-06-01";
const late = (days: number, tax = 1_000_000, fraud = false) =>
  computeLateFiling({ tax, deadline: D, filedOn: addDays(D, days), fraud });

describe("원문과 대조 — 국세기본법 [시행 2026. 10. 2.]", () => {
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

describe("감면 구간 — 30일이 아니라 달력으로 센다 (국세기본법 제4조 → 민법 제157조·제160조)", () => {
  // 기산일 6/2. 1개월 → 7/2 의 전일 7/1, 3개월 → 9/1, 6개월 → 12/1 (손으로 센 값)
  it("기한 6월 1일의 경계", () => {
    expect(periodEnd(D, 1)).toBe("2026-07-01");
    expect(periodEnd(D, 3)).toBe("2026-09-01");
    expect(periodEnd(D, 6)).toBe("2026-12-01");
  });

  it.each([
    ["2026-06-01", 0], // 기한 당일 — 늦지 않음
    ["2026-06-02", 0.5],
    ["2026-07-01", 0.5],
    ["2026-07-02", 0.3],
    ["2026-08-31", 0.3], // 91일째 — 30일 근사로는 20%였다
    ["2026-09-01", 0.3], // 92일째
    ["2026-09-02", 0.2],
    ["2026-11-29", 0.2], // 181일째 — 30일 근사로는 0%였다
    ["2026-12-01", 0.2], // 183일째
    ["2026-12-02", 0],
    ["2027-06-01", 0],
  ])("%s 신고 → 감면 %f", (filedOn, expected) => {
    expect(lateFilingRelief(D, filedOn).relief).toBe(expected);
  });

  it("최종의 월에 해당일이 없으면 그 월의 말일로 만료 (제160조 제3항)", () => {
    // 기한 8/30 → 기산일 8/31 → 9월에 31일이 없으니 9/30 만료. 31일째인데 아직 50%.
    expect(periodEnd("2026-08-30", 1)).toBe("2026-09-30");
    expect(lateFilingRelief("2026-08-30", "2026-09-30").relief).toBe(0.5);
  });

  it("2월을 지나면 30일보다 짧다", () => {
    // 기한 1/31 → 기산일 2/1 → 3/1 의 전일 2/28. 29일째(3/1)에 이미 30%.
    expect(periodEnd("2027-01-31", 1)).toBe("2027-02-28");
    expect(lateFilingRelief("2027-01-31", "2027-03-01").relief).toBe(0.3);
  });
});

describe("기한 후 신고 가산세", () => {
  it("신고 안 한 세액 100만원, 10일 늦음(6/11 신고·납부)", () => {
    const p = late(10);
    expect(p.daysLate).toBe(10);
    expect(p.noReportBase).toBe(200_000); // 20%
    expect(p.reliefRate).toBe(0.5); // 1개월 이내
    expect(p.reliefUntil).toBe("2026-07-01");
    expect(p.reliefAmount).toBe(100_000);
    expect(p.noReport).toBe(100_000);
    // 기한 다음 날(6/2)부터 납부일 전날(6/10)까지 9일 (제47조의4 제1항 제1호)
    expect(p.lateDays).toBe(9);
    expect(p.latePayment).toBe(1_980);
    expect(p.total).toBe(101_980);
    expect(p.grandTotal).toBe(1_101_980);
  });

  it("기한 다음 날 내면 납부지연가산세는 0일", () => {
    const p = late(1);
    expect(p.lateDays).toBe(0);
    expect(p.latePayment).toBe(0);
    expect(p.noReport).toBe(100_000);
  });

  it("6개월을 넘기면 무신고가산세 감면이 사라진다", () => {
    const inTime = late(183); // 12/1
    const tooLate = late(184); // 12/2
    expect(inTime.reliefRate).toBe(0.2);
    expect(tooLate.reliefRate).toBe(0);
    expect(tooLate.reliefExpired).toBe(true);
    expect(tooLate.reliefUntil).toBeNull();
    expect(tooLate.noReport).toBeGreaterThan(inTime.noReport);
  });

  it("납부지연가산세는 감면되지 않는다 — 무신고가산세만 줄어든다", () => {
    const p = late(10);
    expect(p.noReportBase - p.noReport).toBe(p.reliefAmount);
    expect(p.latePayment).toBe(Math.floor(1_000_000 * 0.00022 * 9));
  });

  it("부정행위는 40%이고 감면이 없다", () => {
    const p = late(10, 1_000_000, true);
    expect(p.noReportBase).toBe(400_000);
    expect(p.reliefRate).toBe(0);
    expect(p.noReport).toBe(400_000);
  });

  it("늦을수록 총액이 단조 증가한다", () => {
    let prev = -1;
    for (const d of [1, 15, 30, 31, 60, 90, 92, 93, 150, 183, 184, 300, 365]) {
      const t = late(d, 3_000_000).total;
      expect(t, `${d}일`).toBeGreaterThan(prev);
      prev = t;
    }
  });

  it("0원·음수를 넣어도 터지지 않는다", () => {
    for (const tax of [0, -100]) {
      const p = late(30, tax);
      expect(p.total).toBe(0);
      expect(p.grandTotal).toBe(0);
    }
  });

  it("모든 값이 원 단위 정수다", () => {
    const p = late(47, 1_234_567);
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === "number" && k !== "reliefRate") {
        expect(Number.isInteger(v), k).toBe(true);
      }
    }
  });

  it("날짜가 비거나 틀리면 기한 내처럼 0", () => {
    expect(computeLateFiling({ tax: 1_000_000, deadline: D, filedOn: "" }).total).toBe(0);
  });
});

describe("기한 내 신고", () => {
  it("기한 당일이면 가산세가 아예 없다 — 감면 0%와 다른 상태다", () => {
    const p = late(0);
    expect(p.noReportBase).toBe(0);
    expect(p.noReport).toBe(0);
    expect(p.latePayment).toBe(0);
    expect(p.total).toBe(0);
    expect(p.grandTotal).toBe(1_000_000); // 세금은 그대로 낸다
    expect(p.reliefExpired).toBe(false);
  });

  it("하루만 늦어도 무신고가산세가 붙는다", () => {
    expect(late(1).total).toBeGreaterThan(0);
  });

  it("부정행위도 기한 내면 0이다", () => {
    expect(late(0, 1_000_000, true).total).toBe(0);
  });
});
