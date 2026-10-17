/**
 * 실업급여 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·일수·기간이 unemployment-2026.json 과 unemployment.ts 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/unemployment-2026.json";
import { unemploymentSeries } from "../../data/series/unemployment";
import { unemploymentBenefit, dailyHoursBeforeLeaving, daysInLastThreeMonths, benefitDays } from "../unemployment";
import { won } from "../won";

const D = r.days;
const E = r.eligibility;
const ex = unemploymentBenefit({ wage3m: 9_000_000, days3m: 92, insuredYears: 4 });

describe("실업급여 계산", () => {
  it("2026 주 40시간 하한 66,048원(10,320 × 8 × 80%), 상한 68,100원(113,500 × 60%)", () => {
    expect(ex.minDaily).toBe(66_048);
    expect(ex.maxDaily).toBe(68_100);
  });
  it("2027 최저임금이면 하한 68,480원이 상한보다 커서 하한을 준다(제46조 제2항)", () => {
    const x = unemploymentBenefit({ wage3m: 15_000_000, days3m: 92, insuredYears: 4, year: 2027 });
    expect([x.minDaily, x.daily, x.which]).toEqual([68_480, 68_480, "하한"]);
    // 60%(상한까지) 68,100원 + 하한까지 보탠 380원
    expect([x.byRate, x.daily - x.byRate]).toEqual([68_100, 380]);
  });
  it("하루 금액 = 60%(상한까지) + 하한까지 보탠 금액 — 300만원 58,695 + 7,353, 340만원 66,521 + 0", () => {
    expect([ex.byRate, ex.daily - ex.byRate]).toEqual([58_695, 7_353]);
    const mid = unemploymentBenefit({ wage3m: 10_200_000, days3m: 92, insuredYears: 4 });
    expect([mid.byRate, mid.daily, mid.which]).toEqual([66_521, 66_521, "60%"]);
  });
  it("월급 300만원·가입 4년·50세 미만 → 66,048원 × 180일 = 11,888,640원", () => {
    expect([ex.daily, ex.days, ex.total]).toEqual([66_048, 180, 11_888_640]);
  });
  it("1일 소정근로시간: 주 40 → 8, 주 20 → 4 / 3개월 일수", () => {
    expect([dailyHoursBeforeLeaving(40), dailyHoursBeforeLeaving(20)]).toEqual([8, 4]);
    expect(daysInLastThreeMonths(new Date(2026, 9, 14))).toBe(92);
  });
  it.each([
    // 3개월 전 같은 날이 없으면 그 달 말일(민법 제160조 제3항) — 날짜가 다음 달로 넘어가 89·91일이 나오던 것
    [[2026, 4, 29], 90],
    [[2026, 4, 30], 91],
    [[2026, 4, 31], 92],
    [[2026, 11, 31], 92],
    [[2026, 2, 31], 90],
    [[2026, 9, 14], 92],
  ])("3개월 일수 %j → %i일", ([y, m, d], days) => {
    expect(daysInLastThreeMonths(new Date(y, m, d))).toBe(days);
  });
  it("별표 1 경계", () => {
    expect([benefitDays(0.9, false), benefitDays(1, false), benefitDays(10, true), benefitDays(3, true)]).toEqual([120, 150, 270, 210]);
  });
});

const money = new Set([won(ex.minDaily), won(ex.maxDaily), won(ex.total), "300만원"]);
const counts = new Set([
  `${E.basePeriodMonths}개월`, `${E.insuredDays}일`, `${D.under50[0]}~${D.over50[4]}일`, `${r.period.months}개월`, `${r.period.waitingDays}일`,
  `${D.under50[0]}일`, `${D.over50[4]}일`, `${D.under50[2]}일`, "40시간", "3시간", "4년", "50세", "10년", "1년", "1~4주", "2026년", "3개월", "1일",
]);

describe("실업급여 시리즈 제목·설명", () => {
  for (const s of [unemploymentSeries.hub, ...unemploymentSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,.~])\d+(?:~\d+)?(?:개월|일|시간|년|세|주)/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
