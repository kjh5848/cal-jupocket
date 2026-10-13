import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { formulaAmount, earnedIncentive, firstHalf, halfYearSchedule } from "../earned-incentive";
import { iso } from "../tax-deadline";
import { eokwon } from "../won";
import r from "../../rates/earned-incentive-2026.json";

/** 근로장려금 — 조세특례제한법 제100조의5 ① 표와 손으로 대조한 값. */
describe("법 식(제100조의5 ①)", () => {
  it("단독 200만원 → ×165/400 = 82만 5천원", () => expect(formulaAmount("single", 2_000_000).amount).toBe(825_000));
  it("단독 400만~900만원 165만원", () => expect(formulaAmount("single", 6_000_000).amount).toBe(1_650_000));
  it("단독 1,550만원 → 165만 − 650만×165/1,300 = 82만 5천원", () => expect(formulaAmount("single", 15_500_000).amount).toBe(825_000));
  it("홑벌이 700만~1,400만원 285만원", () => expect(formulaAmount("oneEarner", 10_000_000).amount).toBe(2_850_000));
  it("홑벌이 2,300만원 → 285만 − 900만×285/1,800 = 142만 5천원", () => expect(formulaAmount("oneEarner", 23_000_000).amount).toBe(1_425_000));
  it("맞벌이 800만~1,700만원 330만원", () => expect(formulaAmount("dual", 12_000_000).amount).toBe(3_300_000));
  it("맞벌이 3,050만원 → 330만 − 1,350만×330/2,700 = 165만원", () => expect(formulaAmount("dual", 30_500_000).amount).toBe(1_650_000));
  it("총소득기준금액부터 0", () => expect(formulaAmount("dual", 44_000_000).amount).toBe(0));
});

describe("결정 금액", () => {
  it("단독 2,200만원이면 대상이 아니다", () => expect(earnedIncentive({ household: "single", pay: 22_000_000 }).eligible).toBe(false));
  it("재산 1억7천만원 이상이면 절반", () =>
    expect(earnedIncentive({ household: "oneEarner", pay: 10_000_000, assets: 170_000_000 }).amount).toBe(1_425_000));
  it("기한 후 신청은 95%", () => expect(earnedIncentive({ household: "dual", pay: 12_000_000, late: true }).amount).toBe(3_135_000));
  it("오르는 구간에서 10만원 미만이면 10만원(제100조의7 ③)", () =>
    expect(earnedIncentive({ household: "single", pay: 100_000 }).amount).toBe(100_000));
  it("1만5천원 미만이면 없다", () => expect(earnedIncentive({ household: "single", pay: 30_000 }).amount).toBe(0));
  it("줄어드는 구간에서 3만원 미만이면 3만원", () => {
    // 단독 2,180만원 → 165만 − 1,280만×165/1,300 = 2만 5,384원
    expect(Math.floor(formulaAmount("single", 21_800_000).amount)).toBe(25_384);
    expect(earnedIncentive({ household: "single", pay: 21_800_000 }).amount).toBe(30_000);
  });
});

describe("반기 신청 상반기분(제100조의5 ②)", () => {
  it("6개월 근무 900만원 → 1,800만원으로 보고 홑벌이 221만 6,666원 × 35%", () => {
    const x = firstHalf("oneEarner", 9_000_000, 6);
    expect(x.annualized).toBe(18_000_000);
    expect(x.amount).toBe(Math.floor(2_216_666 * 0.35));
  });
  it("3개월 근무 600만원 → 600 ÷ 3 × 9 = 1,800만원으로 본다", () => expect(firstHalf("oneEarner", 6_000_000, 3).annualized).toBe(18_000_000));
  it("15만원 미만이면 정산 때로 미룬다", () => expect(firstHalf("single", 20_000_000, 6).held).toBe(false));
});

describe("반기 일정", () => {
  it("2026년 상반기분: 9월 15일(화) 기한, 12월 15일까지 결정", () => {
    const s = halfYearSchedule(2026);
    expect(iso(s.first.deadline)).toBe("2026-09-15");
    expect(iso(s.first.decideBy)).toBe("2026-12-15");
  });
  it("2026년 하반기분: 2027년 3월 15일(월) 기한, 6월 15일까지 결정", () => {
    const s = halfYearSchedule(2026);
    expect(iso(s.second.from)).toBe("2027-03-01");
    expect(iso(s.second.deadline)).toBe("2027-03-15");
    expect(iso(s.second.decideBy)).toBe("2027-06-15");
  });
});

describe("글의 제목·설명 — 문자열이라 rates 와 대조한다", async () => {
  const { earnedIncentiveSeries } = await import("../../data/series/earned-incentive");
  const E = r.eligibility;
  const F = r.formula;
  const allowedMoney = new Set(
    [E.totalIncomeUnder.single, E.totalIncomeUnder.oneEarner, E.totalIncomeUnder.dual, E.assetsUnder, F.single.max, F.oneEarner.max,
      F.dual.max, r.reductions.assets.from, r.halfYear.holdUnder, E.excludedByDecree.monthlyPayFrom].map(eokwon),
  );
  const allowedOther = new Set([`${Math.round(r.reductions.late.rate * 100)}%`, `${Math.round(r.halfYear.firstHalfRate * 100)}%`, "6개월", "3개월", "30일", "15일", "70세", "18세"]);
  for (const s of [earnedIncentiveSeries.hub, ...earnedIncentiveSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const head = (src.match(/^const title = "([^"]+)";/m)?.[1] ?? "") + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(head.length).toBeGreaterThan(40);
      for (const m of head.matchAll(/[\d,]+억[\d,]*천?만원|[\d,]+천만원|[\d,]+만원/g)) expect(allowedMoney, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+세|\d+%|\d+개월|\d+일 안/g)) expect(allowedOther, m[0]).toContain(m[0].replace(" 안", ""));
    });
  }
});
