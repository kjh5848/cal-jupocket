/**
 * 4대보험 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액·기간이 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/four-insurance-2026.json";
import pp from "../../rates/pension-premium-2026.json";
import { fourInsuranceSeries } from "../../data/series/four-insurance";
import { pensionRate, careRatio, payroll, workerRateSum } from "../four-insurance";
import { eokwon } from "../won";

const pct = (v: number) => `${+(v * 100).toFixed(4)}%`;
const H = r.health;
const E = r.employment;
const hw = H.rate * H.employeeShare;
const ex = payroll(3_000_000);
const lo = E.stability[0].rate;
const hi = E.stability[E.stability.length - 1].rate;

const percents = new Set([
  pct(pensionRate()), pct(pensionRate() * 2), pct(pensionRate(2027) * 2), pct(H.rate), pct(hw), pct(r.longTermCare.rate),
  `${(hw * careRatio() * 100).toFixed(2)}%`, `${(workerRateSum() * 100).toFixed(2)}%`, `${(careRatio() * 100).toFixed(2)}%`,
  pct(E.unemployment), pct(E.unemployment * E.workerShare), pct(lo), pct(hi), `${+(lo * 100).toFixed(4)}~${pct(hi)}`,
]);
const money = new Set([
  "300만원", // 예시 월급(입력값)
  `${Math.floor(ex.total / 10_000)}만원`, // "29만원 남짓"
  eokwon(pp.standardIncomeCeiling), `${H.regionalPointValue}원`,
]);
const counts = new Set([
  "60시간", "15시간", "8일", "1개월", "3개월", // 각 시행령의 시간·일수 기준(rates.eligibility 문장에 있다)
  `${r.refund.limitationYears}년`, "1년", // 1년 = 본인부담상한액의 '연간' 합계
  "10일", // 다음 달 10일(health.dueDay)
  `${Number(r.longTermCare.roundingFrom.slice(8))}일`, // 11월 27일
]);

describe("4대보험 시리즈 제목·설명", () => {
  it("rates 문장에 시간·일수 기준이 실제로 있다", () => {
    const e = JSON.stringify(r.eligibility);
    for (const w of ["60시간", "15시간", "8일", "1개월", "3개월"]) expect(e).toContain(w);
    expect(H.dueDay).toContain("10일");
  });

  for (const s of [fourInsuranceSeries.hub, ...fourInsuranceSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+(?:~[\d.]+)?%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d,.]+만원|[\d,.]+원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,.])\d+(?:시간|개월|일|년)(?!\d)/g)) {
        if (/^20\d\d년$/.test(m[0])) continue; // 연도
        expect(counts, m[0]).toContain(m[0]);
      }
    });
  }
});
