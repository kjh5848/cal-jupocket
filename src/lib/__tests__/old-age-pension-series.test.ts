/**
 * 노령연금 시리즈 — 지급률·나이·감액이 국민연금법 조문대로인지, 제목·설명의 숫자가 rates·계산 함수에서 나오는지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/pension-2026.json";
import bp from "../../rates/basic-pension-2026.json";
import { oldAgePensionSeries } from "../../data/series/old-age-pension";
import { coverageRate, pensionAges, rateAtStart, earningsReduction } from "../old-age-pension";
import { manwon } from "../won";

describe("노령연금 계산", () => {
  it("가입기간 — 10년 미만 0, 10년 50%, 1년마다 5%, 20년 이상 100%(제63조 ①)", () => {
    expect([coverageRate(9.9), coverageRate(10), coverageRate(15), coverageRate(19.5), coverageRate(25)]).toEqual([0, 0.5, 0.75, 0.975, 1]);
  });
  it("출생연도별 수급 나이(부칙 제8조) — 1952년 60세, 1953 61세 … 1969 65세", () => {
    expect([1952, 1953, 1956, 1957, 1961, 1965, 1969, 1990].map((y) => pensionAges(y).startAge)).toEqual([60, 61, 61, 62, 63, 64, 65, 65]);
    expect(pensionAges(1969)).toEqual({ startAge: 65, earliestAge: 60, latestAge: 70 });
  });
  it("조기 70~94%(제63조 ②), 연기 월 0.6% 최대 5년(제62조)", () => {
    expect([60, 61, 64, 65, 66, 70, 72].map((x) => rateAtStart(1969, x))).toEqual([0.7, 0.76, 0.94, 1, 1.072, 1.36, 1.36]);
    expect(rateAtStart(1969, 59)).toBeNull();
  });
  it("소득 감액(제63조의2) — 200만원 미만 없음, 200만원 15만원, 연금액 1/2 한도", () => {
    expect(earningsReduction(1_999_999, 1_000_000)).toBe(0);
    expect(earningsReduction(2_000_000, 1_000_000)).toBe(150_000);
    expect(earningsReduction(3_500_000, 1_000_000)).toBe(400_000);
    expect(earningsReduction(5_000_000, 1_000_000)).toBe(500_000);
    expect(earningsReduction(5_000_000, 600_000)).toBe(300_000);
  });
});

const money = new Set([manwon(bp.selection.single)]);
const pcts = new Set(["70%", "136%", "6%", "0.6%"]);

describe("노령연금 시리즈 제목·설명", () => {
  it("지급률 문구는 계산 함수와 같다", () => {
    expect(rateAtStart(1969, 60)).toBe(0.7);
    expect(rateAtStart(1969, 70)).toBe(1.36);
  });
  for (const s of [oldAgePensionSeries.hub, ...oldAgePensionSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(pcts, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(\d+)년 이상/g)) expect(Number(m[1])).toBe(r.minCoverageYears);
    });
  }
});
