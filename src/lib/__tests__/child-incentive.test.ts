import { describe, it, expect } from "vitest";
import { perChild, childIncentive, schedule } from "../child-incentive";
import { iso } from "../tax-deadline";
import r from "../../rates/child-incentive-2026.json";

/** 자녀장려금 — 조세특례제한법 제100조의29 ① 표와 손으로 대조한 값. */
describe("1명당 금액(제100조의29 ①)", () => {
  it("홑벌이 2,100만원 미만은 100만원", () => expect(perChild("single", 20_999_999)).toBe(1_000_000));
  it("홑벌이 2,100만원에서 줄기 시작", () => expect(perChild("single", 21_000_000)).toBe(1_000_000));
  it("홑벌이 4,550만원 → 100만 − 2,450만×50/4,900 = 75만", () => expect(perChild("single", 45_500_000)).toBe(750_000));
  it("맞벌이 2,500만원 미만은 100만원", () => expect(perChild("dual", 24_000_000)).toBe(1_000_000));
  it("맞벌이 4,750만원 → 100만 − 2,250만×50/4,500 = 75만", () => expect(perChild("dual", 47_500_000)).toBe(750_000));
  it("7천만원 직전이면 50만원에 가깝다", () => expect(Math.round(perChild("single", 69_999_999))).toBe(500_000));
  it("7천만원부터 0", () => expect(perChild("dual", 70_000_000)).toBe(0));
});

describe("자녀장려금 어림", () => {
  it("홑벌이 2,000만원, 자녀 2명 → 200만원", () =>
    expect(childIncentive({ household: "single", pay: 20_000_000, children: 2 }).amount).toBe(2_000_000));
  it("재산 1억7천만원 이상이면 절반(제100조의5 ④ 준용)", () =>
    expect(childIncentive({ household: "single", pay: 20_000_000, children: 2, assets: 170_000_000 }).amount).toBe(1_000_000));
  it("재산 2억4천만원이면 신청 못 한다", () =>
    expect(childIncentive({ household: "single", pay: 20_000_000, children: 2, assets: 240_000_000 }).eligible).toBe(false));
  it("기한 후 신청은 95%(제100조의7 ② 준용)", () =>
    expect(childIncentive({ household: "single", pay: 20_000_000, children: 1, late: true }).amount).toBe(950_000));
  it("자녀세액공제 받은 만큼 뺀다(시행령 제100조의31 ②)", () =>
    expect(childIncentive({ household: "single", pay: 20_000_000, children: 2, childTaxCredit: 550_000 }).amount).toBe(1_450_000));
  it("빼고 남은 게 3만원 미만이면 3만원(제100조의31 ②)", () => {
    const x = childIncentive({ household: "single", pay: 20_000_000, children: 1, childTaxCredit: 990_000 });
    expect(x.floored).toBe(true);
    expect(x.amount).toBe(30_000);
  });
  it("0원이면 3만원으로 올리지 않는다", () =>
    expect(childIncentive({ household: "single", pay: 20_000_000, children: 1, childTaxCredit: 1_000_000 }).amount).toBe(0));
  it("부양자녀가 없으면 대상이 아니다", () =>
    expect(childIncentive({ household: "single", pay: 20_000_000, children: 0 }).eligible).toBe(false));
});

describe("일정", () => {
  it("2026년 소득분은 2027년 5월에 신청, 기한 5월 31일(월)", () => {
    const s = schedule(2026);
    expect(iso(s.from)).toBe("2027-05-01");
    expect(iso(s.deadline)).toBe("2027-05-31");
    expect(iso(s.lateTo)).toBe("2027-11-30");
    expect(iso(s.decideBy)).toBe("2027-08-31");
  });
  it("2025년 소득분은 5월 31일이 일요일이라 6월 1일까지", () => {
    const s = schedule(2025);
    expect(iso(s.deadline)).toBe("2026-06-01");
    expect(iso(s.decideBy)).toBe("2026-09-01");
  });
});

describe("범위를 지킨다", () => {
  it("산정표(별표)는 읽지 않았다고 적어 둔다", () =>
    expect(r.notVerified.join(" ")).toMatch(/별표 11의2/));
});

describe("eokwon 표기", () => {
  it("억·천만", async () => {
    const { eokwon } = await import("../won");
    expect(eokwon(240_000_000)).toBe("2억4천만원");
    expect(eokwon(170_000_000)).toBe("1억7천만원");
    expect(eokwon(70_000_000)).toBe("7천만원");
    expect(eokwon(21_000_000)).toBe("2,100만원");
    expect(eokwon(1_000_000)).toBe("100만원");
    expect(eokwon(30_000)).toBe("3만원");
    expect(eokwon(100_000_000)).toBe("1억원");
  });
});

describe("글의 제목·설명 — 문자열이라 rates 와 대조한다", async () => {
  const { readFileSync } = await import("node:fs");
  const { eokwon } = await import("../won");
  const { childIncentiveSeries } = await import("../../data/series/child-incentive");
  const F = r.formula;
  const allowedMoney = new Set(
    [r.eligibility.totalIncomeUnder, r.eligibility.assetsUnder, F.perChildMax, F.perChildAtCap, F.single.flatUnder,
      F.dual.flatUnder, r.reductions.assets.from, r.reductions.floor.amount].map(eokwon),
  );
  const allowedOther = new Set([
    `${r.dependentChild.ageUnder}세`, `${Math.round(r.reductions.late.rate * 100)}%`,
    `${r.apply.late.months}개월`, `${r.decision.months}개월`, `${r.refund.days}일`,
  ]);
  const slugs = [childIncentiveSeries.hub, ...childIncentiveSeries.items].map((x) => x.slug);
  for (const slug of slugs) {
    it(slug, () => {
      const src = readFileSync(`src/pages/guide/${slug}/index.astro`, "utf-8");
      const head = (src.match(/^const title = "([^"]+)";/m)?.[1] ?? "") + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(head.length).toBeGreaterThan(40);
      for (const m of head.matchAll(/[\d,]+억[\d,]*천?만원|[\d,]+억원|[\d,]+천만원|[\d,]+만원/g)) expect(allowedMoney, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+세|\d+%|\d+개월|\d+일 안/g)) expect(allowedOther, m[0]).toContain(m[0].replace(" 안", ""));
    });
  }
  it("신청·결정 날짜", () => {
    const s = schedule(r.year);
    const apply = readFileSync("src/pages/guide/child-incentive-apply/index.astro", "utf-8");
    expect(apply).toContain(`${r.year + 1}년 5월 1일부터 5월 31일까지`);
    expect(iso(s.deadline)).toBe(`${r.year + 1}-05-31`);
    const pay = readFileSync("src/pages/guide/child-incentive-pay-date/index.astro", "utf-8");
    expect(pay).toContain(`${r.year + 1}년 8월 31일까지 결정`);
    expect(iso(s.decideBy)).toBe(`${r.year + 1}-08-31`);
  });
});
