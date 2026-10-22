import { describe, it, expect } from "vitest";
import { holdingTax, propertyTaxCredit, propertyRatio, trunc10, TOP_RATE } from "../holding-tax";
import { readFileSync } from "node:fs";
import J from "../../rates/comprehensive-property-2026.json";
import local from "../../rates/local-tax-2026.json";
import { holdingTaxSeries } from "../../data/series/holding-tax";
import { eokwon } from "../won";

const 억 = 100_000_000;

describe("공제할 재산세액 — 시행령 제4조의3 ①, 집행기준 9-4의3", () => {
  it("분자는 0.4% 를 누진공제 없이, 분모는 누진공제를 빼고", () => {
    expect(TOP_RATE).toBe(0.004);
    // 10억 + 8억, 2주택: 종부세 과표 (18억 − 9억) × 60% = 5.4억
    // 분자 5.4억 × 60% × 0.4% = 1,296,000 · 분모 10.8억 × 0.4% − 630,000 = 3,690,000
    const c = propertyTaxCredit({ levied: 3_060_000, totalPrice: 18 * 억, jongbuTaxBase: 540_000_000, jongbuTax: 3_180_000, oneHome: false });
    expect(c).toEqual({ numerator: 1_296_000, denominator: 3_690_000, credit: 1_074_731 });
  });

  it("1세대 1주택은 재산세 비율 43~45%(시행령 제109조 ① 2호 단서), 다주택은 60%", () => {
    expect(propertyRatio(20 * 억, true)).toBe(0.45);
    expect(propertyRatio(5 * 억, true)).toBe(0.44);
    expect(propertyRatio(20 * 억, false)).toBe(0.6);
  });

  it("과세표준이 0 이면 공제도 0, 공제는 종부세 산출세액을 넘지 않는다", () => {
    expect(propertyTaxCredit({ levied: 1_000_000, totalPrice: 8 * 억, jongbuTaxBase: 0, jongbuTax: 0, oneHome: false }).credit).toBe(0);
    expect(propertyTaxCredit({ levied: 9_000_000, totalPrice: 18 * 억, jongbuTaxBase: 540_000_000, jongbuTax: 1_000, oneHome: false }).credit).toBe(1_000);
  });

  it("10원 미만 버림(국고금 관리법 제47조 ①)", () => {
    expect(trunc10(2_105_269)).toBe(2_105_260);
    expect(trunc10(9)).toBe(0);
  });
});

describe("holdingTax — 재산세 + 종부세 + 농특세", () => {
  it("20억 1세대 1주택, 도시지역분, 공제율 없음", () => {
    const r = holdingTax({ houses: [{ price: 20 * 억, urban: true }], oneHome: true });
    // 재산세 과표 9억(45%) — 9억 초과라 특례세율 없음: 570,000 + 6억 × 0.4% = 2,970,000
    expect([r.propertyTax, r.urbanArea, r.educationTax]).toEqual([2_970_000, 1_260_000, 594_000]);
    // 종부세 과표 (20억 − 12억) × 60% = 4.8억 → 1,500,000 + 1.8억 × 0.7% = 2,760,000
    expect(r.jongbuGross).toBe(2_760_000);
    // 부과세액 = 분모(표준세율 그대로) → 공제 = 분자 4.8억 × 45% × 0.4%
    expect(r.credit.credit).toBe(864_000);
    expect([r.jongbu, r.rural, r.total]).toEqual([1_896_000, 379_200, 7_099_200]);
  });

  it("15억 1세대 1주택, 비도시, 65세·10년 보유(30% + 40%)", () => {
    const r = holdingTax({ houses: [{ price: 15 * 억 }], oneHome: true, age: 65, years: 10 });
    expect(r.propertyTax).toBe(2_070_000);
    expect(r.jongbuGross).toBe(900_000);
    expect(r.credit.credit).toBe(324_000);
    expect(r.oneHomeRate).toBe(0.7);
    // (900,000 − 324,000) × 30% = 172,800
    expect([r.jongbu, r.rural, r.total]).toEqual([172_800, 34_560, 2_691_360]);
  });

  it("10억 + 8억 2주택, 도시지역분", () => {
    const r = holdingTax({ houses: [{ price: 10 * 억, urban: true }, { price: 8 * 억, urban: true }] });
    expect([r.propertyTax, r.urbanArea, r.educationTax]).toEqual([3_060_000, 1_512_000, 612_000]);
    expect(r.jongbuGross).toBe(3_180_000);
    // 3,180,000 − 1,074,731 = 2,105,269 → 2,105,260
    expect([r.jongbu, r.rural, r.total]).toEqual([2_105_260, 421_050, 7_710_310]);
  });

  it("10억 + 8억 + 7억 3주택 — 과표 12억 이하라 세율표는 2주택과 같다", () => {
    const r = holdingTax({ houses: [{ price: 10 * 억, urban: true }, { price: 8 * 억, urban: true }, { price: 7 * 억, urban: true }] });
    expect(r.propertyTax).toBe(4_110_000);
    expect(r.jongbuGross).toBe(7_200_000);
    expect(r.credit.credit).toBe(1_763_396);
    expect([r.jongbu, r.rural, r.total]).toEqual([5_436_600, 1_087_320, 13_555_920]);
  });

  it("공제 이하면 종부세 0 — 1주택 12억, 2주택 합계 9억", () => {
    const a = holdingTax({ houses: [{ price: 12 * 억 }], oneHome: true });
    expect([a.jongbu, a.rural, a.total]).toEqual([0, 0, a.propertyBill]);
    const b = holdingTax({ houses: [{ price: 5 * 억 }, { price: 4 * 억 }] });
    expect(b.jongbu).toBe(0);
    expect(b.total).toBe(b.propertyBill);
  });

  it("집이 둘이면 1세대 1주택을 체크해도 받지 않는다", () => {
    const r = holdingTax({ houses: [{ price: 10 * 억 }, { price: 8 * 억 }], oneHome: true, age: 70, years: 15 });
    expect(r.oneHome).toBe(false);
    expect(r.oneHomeRate).toBe(0);
    expect(r.jongbuDeduction).toBe(900_000_000);
  });

  it("공시가격 0 인 칸은 주택 수에 넣지 않는다", () => {
    const r = holdingTax({ houses: [{ price: 20 * 억, urban: true }, { price: 0 }], oneHome: true });
    expect(r.homes).toBe(1);
    expect(r.total).toBe(7_099_200);
  });
});

/**
 * 보유세 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·비율이 rates 와 어긋나지 않는지 대조한다.
 */
describe("보유세 시리즈 제목·설명", () => {
  const pct = (v: number) => `${Number((v * 100).toFixed(2))}%`;
  const money = new Set([J.taxBase.deduction.oneHouseholdOneHome, J.taxBase.deduction.other].map(eokwon));
  const rates = new Set([pct(J.ruralTax.rate), pct(TOP_RATE)]);
  it("rates 숫자", () => {
    expect([J.taxBase.deduction.oneHouseholdOneHome, J.taxBase.deduction.other]).toEqual([12 * 억, 9 * 억]);
    expect(local.propertyTax.assessmentDate).toBe("6월 1일");
    expect(J.payment.from.startsWith("12월")).toBe(true);
  });
  for (const s of [holdingTaxSeries.hub, ...holdingTaxSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+억원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(rates, m[0]).toContain(m[0]);
    });
  }
});
