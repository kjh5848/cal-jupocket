/**
 * 육아휴직 시리즈 — 제목·설명의 금액·기간이 parental-leave-2026.json 과 parental-leave.ts 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/parental-leave-2026.json";
import { parentalLeaveSeries } from "../../data/series/parental-leave";
import { schedule, monthlyPay, maternityPay, bandTotals } from "../parental-leave";
import { eokwon, won } from "../won";

const P = r.pay;
const M = r.maternity;

describe("육아휴직 급여 계산", () => {
  it("상한 250·200·160만원, 하한 70만원, 1년 최대 2,310만원", () => {
    expect([monthlyPay(9e6, 1), monthlyPay(9e6, 4), monthlyPay(9e6, 7), monthlyPay(5e5, 1)]).toEqual([2_500_000, 2_000_000, 1_600_000, 700_000]);
    expect(schedule(9e6, 12).total).toBe(23_100_000);
  });
  it("통상임금 300만원 2,310만원, 200만원 2,160만원", () => {
    expect([schedule(3e6, 12).total, schedule(2e6, 12).total]).toEqual([23_100_000, 21_600_000]);
  });
  it("6+6 상한 250·250·300·350·400·450, 6개월 2,000만원", () => {
    expect(schedule(9e6, 6, "sixSix").rows.map((x) => x.pay)).toEqual([2.5e6, 2.5e6, 3e6, 3.5e6, 4e6, 4.5e6]);
    expect(schedule(9e6, 6, "sixSix").total).toBe(20_000_000);
  });
  it("구간 소계 1~3 · 4~6 · 7개월째부터, 합은 총액", () => {
    const x = schedule(3e6, 12);
    expect(bandTotals(x.rows)).toEqual({ first3: 7_500_000, next3: 6_000_000, after6: 9_600_000 });
    expect(bandTotals(schedule(1_234_567, 12).rows).after6).toBe(987_653 * 6);
    expect(bandTotals(schedule(5e6, 6, "sixSix").rows)).toEqual({ first3: 8_000_000, next3: 12_000_000, after6: 0 });
    expect(bandTotals(schedule(2e6, 2).rows)).toEqual({ first3: 4_000_000, next3: 0, after6: 0 });
    expect(bandTotals(schedule(8e5, 12).rows).after6).toBe(700_000 * 6);
  });
  it("출산휴가 고용보험 상한 90일 660만원, 대기업 30일 220만원", () => {
    expect([maternityPay(5e6, true).insurance, maternityPay(5e6, false).insurance]).toEqual([6_600_000, 2_200_000]);
  });
});

const money = new Set([
  ...P.bands.map((b) => eokwon(b.cap)), eokwon(P.floor), eokwon(schedule(9e6, 12).total), eokwon(P.sixSix.caps[5]),
  eokwon(M.cap90), eokwon(2_200_000), eokwon(schedule(3e6, 12).total), eokwon(schedule(2e6, 12).total),
  "250만", "200만", "160만원", "300만원",
]);
const counts = new Set(["1개월", `${P.applyWindowMonths}개월`, "3개월", "4~6개월", "1~6개월", "7개월", "6개월", "18개월", `${M.days}일`, `${M.premieDays}일`, `${M.multiDays}일`, `${M.paidDays}일`, "30일", "1년", "8세", "2학년", "2026년", "8월", "20일", "1~2주"]);

describe("육아휴직 시리즈 제목·설명", () => {
  for (const s of [parentalLeaveSeries.hub, ...parentalLeaveSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+만원|[\d,]+만(?=·)/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,.~])\d+(?:~\d+)?(?:개월|일|년|세|학년|월|주)(?![\d])/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
