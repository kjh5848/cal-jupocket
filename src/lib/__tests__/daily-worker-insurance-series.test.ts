/**
 * 일용직 4대보험 계산기 — 가입 판정 경계(시행령 제2조 제1호 가·나목, 건강보험법 시행령 제9조 제1호)와
 * roberin 대조 입력(2026-10-19, docs/calc-benchmark.md)을 고정한다. 새 글 제목·설명의 숫자도 rates 와 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/four-insurance-2026.json";
import { dailyWorkerInsurance, dailyEligibility, dailyIncomeTax } from "../daily-worker-insurance";

const base = { monthOrMore: true, site: "general" as const, age: "under60" as const };

describe("일용직 가입 판정", () => {
  it("rates 숫자", () => {
    expect(r.daily.pensionMinDays).toBe(8);
    expect(r.daily.pensionMinHours).toBe(60);
    expect(r.daily.healthMinHours).toBe(60);
  });
  it("7일 × 8시간(56시간) — 국민연금 조건부, 건강보험 제외", () => {
    const e = dailyEligibility({ ...base, days: 7, hours: 8 });
    expect(e.pension).toBe("conditional");
    expect(e.health).toBe(false);
  });
  it("8일이면 국민연금 대상", () => {
    expect(dailyEligibility({ ...base, days: 8, hours: 8 }).pension).toBe("covered");
  });
  it("7일 × 9시간(63시간) — 일반 사업장은 연금 대상, 건설 현장은 시간 기준 없음", () => {
    expect(dailyEligibility({ ...base, days: 7, hours: 9 }).pension).toBe("covered");
    expect(dailyEligibility({ ...base, site: "construction", days: 7, hours: 9 }).pension).toBe("conditional");
    // 건강보험은 60시간 이상이면 직장가입(roberin 은 8일 기준을 써 제외로 봄)
    expect(dailyEligibility({ ...base, days: 7, hours: 9 }).health).toBe(true);
  });
  it("1개월 미만이면 고용보험만", () => {
    const e = dailyEligibility({ ...base, monthOrMore: false, days: 20, hours: 8 });
    expect(e.pension).toBe("excluded");
    expect(e.health).toBe(false);
    expect(e.employment).toBe(true);
  });
  it("60세 이상은 국민연금 제외, 65세 이후 새로 고용은 실업급여 보험료 없음", () => {
    expect(dailyEligibility({ ...base, age: "60plus", days: 12, hours: 8 }).pension).toBe("excluded");
    const x = dailyWorkerInsurance({ ...base, age: "65new", dayWage: 200_000, days: 12, hours: 8 });
    expect(x.employment).toBe(0);
    expect(x.pension).toBe(0);
    expect(x.health).toBe(86_280);
  });
});

describe("roberin 대조(2026-10-19)", () => {
  it("일당 20만 × 12일 — 같음", () => {
    const x = dailyWorkerInsurance({ ...base, dayWage: 200_000, days: 12, hours: 8 });
    expect([x.pension, x.health, x.care, x.employment, x.tax.tax, x.tax.local]).toEqual([114_000, 86_280, 11_337, 21_600, 16_200, 1_620]);
    expect(x.takeHome).toBe(2_148_963);
  });
  it("일당 13만 × 8일 — 같음", () => {
    const x = dailyWorkerInsurance({ ...base, dayWage: 130_000, days: 8, hours: 8 });
    expect([x.pension, x.health, x.care, x.employment]).toEqual([49_400, 37_388, 4_912, 9_360]);
  });
  it("일당 5만 × 8일 — 기준소득월액 하한 41만, 연금 10원 미만 절사로 19,470(roberin 19,475)", () => {
    const x = dailyWorkerInsurance({ ...base, dayWage: 50_000, days: 8, hours: 8 });
    expect(x.pensionBase).toBe(410_000);
    expect(x.pension).toBe(19_470);
  });
  it("일당 35만 × 7일 — roberin 은 고시 220만원으로 연금 대상, 우리는 조건부", () => {
    const x = dailyWorkerInsurance({ ...base, dayWage: 350_000, days: 7, hours: 8 });
    expect(x.eligibility.pension).toBe("conditional");
    expect(x.pension).toBe(0);
    expect(x.pensionIfCovered).toBe(116_370);
  });
  it("일당 18만 × 10일 — 매일 받으면 소액부징수, 모아 받으면 8,100원", () => {
    expect(dailyIncomeTax(180_000, 10).tax).toBe(0);
    const lump = dailyIncomeTax(180_000, 10, true);
    expect([lump.tax, lump.local]).toEqual([8_100, 810]);
  });
});

describe("일용직 4대보험 공제 글 제목·설명", () => {
  it("숫자", () => {
    const src = readFileSync("src/pages/guide/daily-worker-insurance-deduction/index.astro", "utf-8");
    const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
    const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
    expect(title).toContain("일용직 4대보험 공제");
    const allowed = new Set(["0.9%", "4.75%", "3.595%", "8일", "60시간", "1개월", "4"]);
    for (const m of head.matchAll(/\d[\d,.]*(?:%|일|시간|개월|원)?/g)) expect(allowed.has(m[0]), m[0]).toBe(true);
  });
});
