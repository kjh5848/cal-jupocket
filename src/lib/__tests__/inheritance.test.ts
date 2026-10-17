import { describe, it, expect } from "vitest";
import {
  computeInheritance,
  deductionsFor,
  taxOn,
  taxFreeCeiling,
  spouseLegalShare,
  funeralAllowed,
  type Household,
} from "../inheritance";
import rates from "../../rates/inheritance-2026.json";

const 억 = 100_000_000;

describe("세율표 (국세청 5단계 초과누진)", () => {
  it("구간마다 누진공제를 뺀다", () => {
    expect(taxOn(1 * 억)).toBe(10_000_000); // 1억 × 10%
    expect(taxOn(5 * 억)).toBe(90_000_000); // 5억 × 20% − 1천만
    expect(taxOn(10 * 억)).toBe(240_000_000); // 10억 × 30% − 6천만
    expect(taxOn(30 * 억)).toBe(1_040_000_000); // 30억 × 40% − 1억 6천만
  });

  it("30억을 넘으면 50%", () => {
    // 50억 × 50% − 4억 6천만
    expect(taxOn(50 * 억)).toBe(2_040_000_000);
  });

  it("과세표준이 0이면 세금도 0", () => {
    expect(taxOn(0)).toBe(0);
    expect(taxOn(-1 * 억)).toBe(0);
  });
});

describe("공제는 더하는 게 아니라 고르는 것이다", () => {
  it("자녀가 적으면 일괄공제 5억이 이긴다", () => {
    // 기초 2억 + 자녀 1명 5천만 = 2억 5천만 < 5억
    const d = deductionsFor({ estate: 0, hasSpouse: false, children: 1 });
    expect(d.itemized).toBe(250_000_000);
    expect(d.chosen).toBe(500_000_000);
    expect(d.chosenLabel).toBe("일괄공제");
  });

  it("인적공제가 5억을 넘으면 그쪽을 쓴다", () => {
    // 기초 2억 + 자녀 7명 × 5천만 = 5억 5천만 > 5억
    const d = deductionsFor({ estate: 0, hasSpouse: false, children: 7 });
    expect(d.itemized).toBe(550_000_000);
    expect(d.chosen).toBe(550_000_000);
    expect(d.chosenLabel).toBe("기초공제 + 인적공제");
  });

  it("둘을 더하지 않는다 — 2억 + 5억 = 7억이 아니다", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: false });
    expect(d.chosen).toBe(500_000_000);
    expect(d.chosen).not.toBe(700_000_000);
  });
});

describe("배우자공제", () => {
  it("한 푼도 안 받아도 5억이 나온다", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: true, spouseShare: 0 });
    expect(d.spouse).toBe(500_000_000);
  });

  it("5억 미만을 받아도 5억", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: true, spouseShare: 200_000_000 });
    expect(d.spouse).toBe(500_000_000);
  });

  it("5억을 넘으면 실제 받은 금액", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: true, spouseShare: 12 * 억 });
    expect(d.spouse).toBe(12 * 억);
  });

  it("30억을 넘지 못한다", () => {
    const d = deductionsFor({ estate: 0, hasSpouse: true, spouseShare: 50 * 억 });
    expect(d.spouse).toBe(rates.spouse.cap);
  });

  it("배우자가 없으면 0", () => {
    expect(deductionsFor({ estate: 0, hasSpouse: false }).spouse).toBe(0);
  });
});

describe("얼마부터 내나 — 가족 구성이 경계를 정한다", () => {
  it("배우자와 자녀가 있으면 10억까지 세금이 없다", () => {
    // 일괄공제 5억 + 배우자 최소 5억 = 10억
    const h: Omit<Household, "estate"> = { hasSpouse: true, children: 2 };
    expect(taxFreeCeiling(h)).toBe(10 * 억);
    expect(computeInheritance({ ...h, estate: 10 * 억 }).payable).toBe(0);
  });

  it("배우자가 없으면 5억이 경계다", () => {
    const h: Omit<Household, "estate"> = { hasSpouse: false, children: 2 };
    expect(taxFreeCeiling(h)).toBe(5 * 억);
    expect(computeInheritance({ ...h, estate: 5 * 억 }).payable).toBe(0);
  });

  it("경계를 1원이라도 넘으면 과세표준이 생긴다", () => {
    const r = computeInheritance({ estate: 10 * 억 + 1, hasSpouse: true, children: 2 });
    expect(r.base).toBe(1);
  });
});

describe("실제 사례 — 10억을 물려받으면", () => {
  it("배우자 있음: 세금 0", () => {
    const r = computeInheritance({ estate: 10 * 억, hasSpouse: true, children: 2 });
    expect(r.deductions.total).toBe(10 * 억);
    expect(r.payable).toBe(0);
  });

  it("배우자 없음: 과세표준 5억 · 신고공제 뒤 8,730만원", () => {
    const r = computeInheritance({ estate: 10 * 억, hasSpouse: false, children: 2 });
    expect(r.base).toBe(5 * 억);
    expect(r.computed).toBe(90_000_000); // 5억 × 20% − 1천만
    expect(r.filingCredit).toBe(2_700_000); // 3%
    expect(r.payable).toBe(87_300_000);
  });

  it("같은 재산인데 배우자 유무로 8,730만원이 갈린다", () => {
    const withSpouse = computeInheritance({ estate: 10 * 억, hasSpouse: true, children: 2 });
    const without = computeInheritance({ estate: 10 * 억, hasSpouse: false, children: 2 });
    expect(without.payable - withSpouse.payable).toBe(87_300_000);
  });
});

describe("신고세액공제 3%", () => {
  it("산출세액의 3%를 깎는다", () => {
    const r = computeInheritance({ estate: 20 * 억, hasSpouse: false, children: 1 });
    expect(r.filingCredit).toBe(Math.round(r.computed * 0.03));
    expect(r.payable).toBe(r.computed - r.filingCredit);
  });

  it("세금이 0이면 공제도 0", () => {
    const r = computeInheritance({ estate: 3 * 억, hasSpouse: false, children: 1 });
    expect(r.computed).toBe(0);
    expect(r.filingCredit).toBe(0);
    expect(r.payable).toBe(0);
  });
});

/*
 * 배우자상속재산분할기한 — 산문 주석에 숨어 있던 오류를 숫자로 꺼낸다.
 *
 * 2026-09-29 까지 rates JSON 의 note 에 "신고기한 다음날부터 6개월" 이라고
 * 적혀 있었다. 원문은 9개월이다(제19조 제2항, 2020. 12. 22. 개정).
 * 산문이라 어떤 테스트도 읽지 않았고, 다른 세션이 이 note 를 보고 글을
 * 썼으면 그대로 나갔을 것이다.
 *
 * 제3항의 "부득이한 사유" 연장이 6개월이라 헷갈리기 딱 좋다.
 */
describe("배우자상속재산분할기한 — 제19조 제2항", () => {
  it("신고기한 다음 날부터 9개월이다. 6개월이 아니다", () => {
    expect(rates.spouse.divisionDeadlineMonths).toBe(9);
    expect(rates.spouse.divisionDeadlineFrom).toContain("신고기한");
  });

  it("어느 조문인지 적혀 있다", () => {
    expect(rates.spouse.divisionDeadlineArticle).toContain("제19조");
  });

  it("note 에 기한 숫자를 다시 적지 않는다 — 두 곳에 있으면 한 곳만 고친다", () => {
    expect(rates.spouse.note).not.toMatch(/\d+개월/);
  });
});

/**
 * 2026-10-18 roberin 대조 + 원문 손계산(제19조 ①1호·④, 제21조 ②, 시행령 제9조 ②·제17조 ①, 민법 제1009조 ②).
 * 장례비 칸을 넘기면 상속재산은 장례비 빼기 전 금액이고 최저 500만원이 빠진다.
 */
describe("배우자 법정상속분 한도 · 배우자 단독상속 · 장례비", () => {
  const F0 = { direct: 0 };

  it("법정상속분 — 자녀 n명이면 1.5/(n+1.5), 혼자면 1", () => {
    expect(spouseLegalShare(2)).toBeCloseTo(3 / 7, 12);
    expect(spouseLegalShare(1)).toBeCloseTo(0.6, 12);
    expect(spouseLegalShare(0)).toBe(1);
  });

  it("장례비 — 직접 500만~1천만 + 봉안 500만 한도", () => {
    expect(funeralAllowed({ direct: 0 })).toBe(5_000_000);
    expect(funeralAllowed({ direct: 8_000_000, memorial: 2_000_000 })).toBe(10_000_000);
    expect(funeralAllowed({ direct: 12_000_000, memorial: 7_000_000 })).toBe(15_000_000);
  });

  it("30억 · 자녀 2 · 배우자 15억 → 한도 30억 × 3/7 (예전엔 15억을 그대로 공제)", () => {
    const r = computeInheritance({ estate: 30 * 억, hasSpouse: true, spouseShare: 15 * 억, children: 2, funeral: F0 });
    expect(r.deductions.spouseLimit).toBe(1_285_714_285); // 원 미만 버림
    expect(r.deductions.spouse).toBe(1_285_714_285);
    expect(r.taxable).toBe(2_995_000_000);
    expect(r.base).toBe(1_209_285_715);
    expect(r.computed).toBe(323_714_286);
    expect(r.payable).toBe(314_002_857); // roberin 314,002,850 — 한도 원 미만·납부세액 10원 미만 단수 차이(보류)
  });

  it("20억 · 배우자(0원) · 자녀 2 → 231,345,000 (roberin 같음)", () => {
    const r = computeInheritance({ estate: 20 * 억, hasSpouse: true, spouseShare: 0, children: 2, funeral: F0 });
    expect(r.base).toBe(995_000_000);
    expect(r.payable).toBe(231_345_000);
  });

  it("30억 · 배우자 없음 · 자녀 3 → 812,860,000 (roberin 같음)", () => {
    expect(computeInheritance({ estate: 30 * 억, hasSpouse: false, children: 3, funeral: F0 }).payable).toBe(812_860_000);
  });

  it("7억 · 배우자 없음 · 자녀 1 → 28,130,000 (roberin 같음)", () => {
    expect(computeInheritance({ estate: 7 * 억, hasSpouse: false, children: 1, funeral: F0 }).payable).toBe(28_130_000);
  });

  it("배우자 혼자 40억 → 일괄공제 없이 기초 2억 + 배우자 30억 → 173,145,000 (roberin 같음)", () => {
    const r = computeInheritance({ estate: 40 * 억, hasSpouse: true, spouseShare: 40 * 억, children: 0, parents: 0, funeral: F0 });
    expect(r.deductions.spouseSole).toBe(true);
    expect(r.deductions.chosen).toBe(2 * 억);
    expect(r.deductions.spouse).toBe(30 * 억);
    expect(r.payable).toBe(173_145_000);
  });

  it("배우자 + 부모 1명 20억, 배우자 10억 → 한도 12억 · 86,330,000 (roberin 같음)", () => {
    const r = computeInheritance({ estate: 20 * 억, hasSpouse: true, spouseShare: 10 * 억, children: 0, parents: 1, funeral: F0 });
    expect(r.deductions.spouseLimit).toBe(12 * 억);
    expect(r.deductions.chosen).toBe(5 * 억);
    expect(r.payable).toBe(86_330_000);
  });

  it("실제 6억인데 한도 4억대 → 원문으로 닫히지 않음 표시", () => {
    const r = computeInheritance({ estate: 10 * 억, hasSpouse: true, spouseShare: 6 * 억, children: 2, funeral: F0 });
    expect(r.deductions.spouseUnclear).toBe(true);
  });

  it("공제는 과세가액까지만 뺀다(제24조) — 과세표준 + 실제 뺀 공제 = 과세가액", () => {
    for (let i = 0; i < 2000; i++) {
      const estate = Math.floor(Math.random() * 60 * 억);
      const h: Household = { estate, debts: Math.floor(Math.random() * estate * 0.3), hasSpouse: i % 2 === 0, spouseShare: Math.floor(Math.random() * estate), children: i % 5, parents: (i % 3) as 0 | 1 | 2, funeral: { direct: Math.floor(Math.random() * 2e7) } };
      const r = computeInheritance(h);
      expect(r.base + r.appliedDeduction).toBe(r.taxable);
      expect(r.taxable).toBe(Math.max(0, estate - r.debts - r.funeral));
    }
  });

  it("장례비·채무를 넘기지 않으면 예전과 같다", () => {
    expect(computeInheritance({ estate: 20 * 억, hasSpouse: true, children: 2 }).payable).toBe(232_800_000);
  });
});
