import { describe, it, expect } from "vitest";
import {
  earnedIncomeDeduction,
  earnedIncomeTaxCredit,
  yearEnd,
  childTaxCredit,
  childCreditAge,
  childCreditEligible,
  latestEligibleBirthYear,
  childCreditBirthRange,
} from "../year-end-calc";
import { taxOn } from "../deduction";
import { readFileSync } from "node:fs";
import y from "../../rates/year-end-2026.json";

/** 연말정산 어림 계산 — 조문 표와 손으로 대조한 값. */
describe("근로소득공제(제47조)", () => {
  it("500만원 이하 70%", () => expect(earnedIncomeDeduction(4_000_000)).toBe(2_800_000));
  it("1,500만원 → 350만 + 1,000만×40% = 750만", () => expect(earnedIncomeDeduction(15_000_000)).toBe(7_500_000));
  it("4,500만원 → 750만 + 3,000만×15% = 1,200만", () => expect(earnedIncomeDeduction(45_000_000)).toBe(12_000_000));
  it("5,000만원 → 1,200만 + 500만×5% = 1,225만", () => expect(earnedIncomeDeduction(50_000_000)).toBe(12_250_000));
  it("한도 2천만원", () => expect(earnedIncomeDeduction(1_000_000_000)).toBe(20_000_000));
});

describe("근로소득세액공제(제59조)", () => {
  it("산출세액 100만원 → 55%", () => expect(earnedIncomeTaxCredit(1_000_000, 30_000_000)).toBe(550_000));
  it("총급여 3,300만원 이하 한도 74만원", () => expect(earnedIncomeTaxCredit(3_000_000, 30_000_000)).toBe(740_000));
  it("총급여 5,000만원 → 74만 − 1,700만×0.8% = 60.4만이라 바닥 66만", () =>
    expect(earnedIncomeTaxCredit(3_000_000, 50_000_000)).toBe(660_000));
  it("총급여 8,000만원 → 바닥 50만", () => expect(earnedIncomeTaxCredit(5_000_000, 80_000_000)).toBe(500_000));
});

describe("연말정산 어림", () => {
  it("총급여 5,000만원, 혼자, 보험료 없이 — 단계별 값", () => {
    const r = yearEnd({ pay: 50_000_000, persons: 1, pensionInsurance: 0, socialInsurance: 0, prepaid: 3_000_000 });
    expect(r.earnedDeduction).toBe(12_250_000);
    expect(r.base).toBe(36_250_000);
    expect(r.computedTax).toBe(taxOn(36_250_000));
    expect(r.earnedCredit).toBe(660_000);
    expect(r.standard).toBe(130_000);
    expect(r.decided).toBe(r.computedTax - 660_000 - 130_000);
    expect(r.diff).toBe(r.decided - 3_000_000);
  });
  it("IRP 300만원을 넣으면 15% 구간이라 45만원이 더 줄어든다", () => {
    const a = yearEnd({ pay: 50_000_000, persons: 1, pensionInsurance: 0, socialInsurance: 0, prepaid: 0 });
    const b = yearEnd({ pay: 50_000_000, persons: 1, pensionInsurance: 0, socialInsurance: 0, irp: 3_000_000, prepaid: 0 });
    expect(a.decided - b.decided).toBe(450_000);
  });
  it("세액공제는 산출세액을 넘지 않는다(제61조)", () => {
    const r = yearEnd({ pay: 15_000_000, persons: 3, pensionInsurance: 0, socialInsurance: 0, irp: 9_000_000, prepaid: 0 });
    expect(r.decided).toBeGreaterThanOrEqual(0);
  });
});

describe("자녀세액공제(제59조의2) — 금액", () => {
  it("1명 25만원", () => expect(childTaxCredit(1)).toBe(250_000));
  it("2명 55만원", () => expect(childTaxCredit(2)).toBe(550_000));
  it("3명 55만 + 40만 = 95만원", () => expect(childTaxCredit(3)).toBe(950_000));
  it("4명 55만 + 40만×2 = 135만원", () => expect(childTaxCredit(4)).toBe(1_350_000));
  it("출산·입양 첫째 30만, 둘째 50만, 셋째 이상 70만(③)", () => {
    expect(childTaxCredit(0, [1])).toBe(300_000);
    expect(childTaxCredit(0, [2])).toBe(500_000);
    expect(childTaxCredit(0, [3])).toBe(700_000);
  });
});

describe("자녀세액공제 — 부칙 <법률 제21548호, 2026. 4. 21.>", () => {
  it("2026~2029년분은 9·10·11·12세 이상(부칙 제2조 ②)", () => {
    expect(childCreditAge(2026, 2010)).toBe(9);
    expect(childCreditAge(2027, 2010)).toBe(10);
    expect(childCreditAge(2028, 2010)).toBe(11);
    expect(childCreditAge(2029, 2010)).toBe(12);
  });
  it("2030년분부터는 개정규정 13세 이상", () => expect(childCreditAge(2030, 2010)).toBe(13));
  it("2017년생에게는 ②를 적용하지 않는다(③) — 13세", () => expect(childCreditAge(2026, 2017)).toBe(13));
  it("나이는 그해에 그 나이가 되는 날이 있으면 된다(제53조 ⑤)", () => {
    expect(childCreditEligible(2026, 2016)).toBe(true); // 2026년에 10세가 되는 날이 있다
    expect(childCreditEligible(2026, 2017)).toBe(false); // ③ — 13세 기준
    expect(childCreditEligible(2026, 2018)).toBe(false);
  });
  it("2026~2029년분 모두 2016년 이전 출생, 2030년분은 2017년생부터", () => {
    for (const y of [2026, 2027, 2028, 2029]) expect(latestEligibleBirthYear(y)).toBe(2016);
    expect(latestEligibleBirthYear(2030)).toBe(2017);
  });
});

describe("자녀세액공제 — 연말정산에 넣으면", () => {
  const base = { pay: 50_000_000, persons: 3, pensionInsurance: 0, socialInsurance: 0, prepaid: 0 };
  it("자녀 2명이면 결정세액이 55만원 줄어든다", () => {
    const a = yearEnd(base);
    const b = yearEnd({ ...base, children: 2 });
    expect(b.child).toBe(550_000);
    expect(a.decided - b.decided).toBe(550_000);
  });
  it("기본공제 인원(본인 제외)을 넘는 자녀는 빼고 알린다", () => {
    const r = yearEnd({ ...base, persons: 2, children: 2 });
    expect(r.child).toBe(250_000);
    expect(r.childClamped).toBe(true);
  });
  it("자녀공제가 커도 결정세액은 0 아래로 가지 않는다(제61조)", () => {
    const r = yearEnd({ pay: 20_000_000, persons: 6, pensionInsurance: 0, socialInsurance: 0, children: 5, births: [3], prepaid: 0 });
    expect(r.child).toBeGreaterThan(r.computedTax);
    expect(r.decided).toBe(0);
  });
});

describe("자녀세액공제 — 출생연도 범위", () => {
  it("2026년분은 2005~2016년생(20세 이하는 그해 1월 1일에 20세면 된다)", () =>
    expect(childCreditBirthRange(2026)).toEqual({ from: 2005, to: 2016 }));
});

describe("자녀세액공제 글 — 제목·설명은 문자열이라 rates 와 대조한다", () => {
  const src = readFileSync("src/pages/guide/year-end-child-tax-credit/index.astro", "utf-8");
  const head = (src.match(/^const title = "([^"]+)";/m)?.[1] ?? "") + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
  const B = y.calc.childTaxCredit.buchik;
  it("나이·출생연도", () => {
    expect(head).toContain(`${B.ageByYear["2026"]}세 이상`);
    expect(head).toContain(`${latestEligibleBirthYear(2026)}년 이전 출생`);
    expect(head).toContain(`${B.excludedBirthYear}년생`);
    expect(head).toContain(`${y.calc.childTaxCredit.age}세 기준`);
  });
  it("금액", () => {
    const A = y.calc.childTaxCredit.amounts;
    for (const n of [A.one, A.two, A.perExtra]) expect(head).toContain(`${n / 10_000}만원`);
  });
});
