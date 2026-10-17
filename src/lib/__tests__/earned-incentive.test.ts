import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { formulaAmount, earnedIncentive, firstHalf, halfYearSchedule, bandInfo, type EarnedHousehold } from "../earned-incentive";
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


/** 계산기 영수증 분해 — 조문 손계산(roberin 에 같은 도구 없음, 2026-10-17) */
describe("분해: 법 식 금액 − 재산 − 기한 후 + 최소 금액 조정 = 결정 금액", () => {
  it("홑벌이 700만원 정확히 → 최대 구간 285만원(가목은 700만원 미만까지)", () => {
    const x = earnedIncentive({ household: "oneEarner", pay: 7_000_000 });
    expect([x.band, x.amount, x.belowMax]).toEqual(["flat", 2_850_000, 0]);
  });
  it("홑벌이 1,400만원 정확히 → 줄어드는 구간 시작, 아직 285만원", () => {
    const x = earnedIncentive({ household: "oneEarner", pay: 14_000_000 });
    expect([x.band, x.amount]).toEqual(["taper", 2_850_000]);
  });
  it("홑벌이 2,000만원·재산 1억7천만원 정확히 → 190만원의 절반 95만원, 줄어든 돈 95만원", () => {
    const x = earnedIncentive({ household: "oneEarner", pay: 20_000_000, assets: 170_000_000 });
    expect([x.base, x.assetsCut, x.amount, x.belowMax]).toEqual([1_900_000, 950_000, 950_000, 950_000]);
  });
  it("재산 2억4천만원 정확히 → 대상 아님", () =>
    expect(earnedIncentive({ household: "oneEarner", pay: 20_000_000, assets: 240_000_000 }).eligible).toBe(false));
  it("단독 25만원·기한 후 → 103,125 × 95% = 97,968 → 10만원(③은 ②로 줄인 금액 포함)", () => {
    const x = earnedIncentive({ household: "single", pay: 250_000, late: true });
    expect([x.base, x.lateCut, x.reduced, x.minAdj, x.amount]).toEqual([103_125, 5_157, 97_968, 2_032, 100_000]);
  });
  it("단독 3만7천원·기한 후 → 15,262 × 95% = 14,498 → 1만5천원 미만이라 없음", () => {
    const x = earnedIncentive({ household: "single", pay: 37_000, late: true });
    expect([x.base, x.reduced, x.minAdj, x.amount]).toEqual([15_262, 14_498, -14_498, 0]);
  });
  it("맞벌이 4,300만원·재산 2억·기한 후 → 122,222 → 61,111 → 58,055", () => {
    const x = earnedIncentive({ household: "dual", pay: 43_000_000, assets: 200_000_000, late: true });
    expect([x.base, x.assetsCut, x.lateCut, x.amount]).toEqual([122_222, 61_111, 3_056, 58_055]);
  });
  it("단독 2,180만원·재산 2억 → 25,384 절반 12,692 → 없음", () =>
    expect(earnedIncentive({ household: "single", pay: 21_800_000, assets: 200_000_000 }).amount).toBe(0));
  it("무작위 2만 건: 항등식이 늘 맞고 줄어든 돈은 0 이상", () => {
    const hs: EarnedHousehold[] = ["single", "oneEarner", "dual"];
    let seed = 7;
    const rnd = () => ((seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648) / 2_147_483_648);
    for (let k = 0; k < 20_000; k++) {
      const x = earnedIncentive({ household: hs[k % 3], pay: Math.floor(rnd() * 45_000_000), assets: Math.floor(rnd() * 250_000_000), late: rnd() < 0.5 });
      expect(x.base - x.assetsCut - x.lateCut + x.minAdj).toBe(x.amount);
      expect(x.assetsCut >= 0 && x.lateCut >= 0 && x.belowMax >= 0).toBe(true);
    }
  });
  it("홑벌이 줄어드는 구간: 1만원 더 벌면 285만/1,800만 × 1만 = 1,583원 남짓 줄어든다", () =>
    expect(Math.floor(bandInfo("oneEarner").taperPer10k)).toBe(1_583));
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
