/**
 * 개인지방소득세 — 소득세의 10%가 아니라 1/10 세율이다.
 *
 * 결과는 대개 비슷한데 계산하는 대상이 다르다. 소득세 **산출세액**에
 * 10%를 곱하는 것이 아니라, 같은 **과세표준**에 1/10 세율표를 적용한다.
 * 세액공제·감면이 끼면 두 값이 갈린다.
 */
import { describe, it, expect } from "vitest";
import { taxOn, bracketPercent, canInstall, BRACKETS, INSTALLMENT } from "../local-income-tax";
import { taxOn as incomeTaxOn } from "../deduction";
import r from "../../rates/local-tax-2026.json";

describe("세율표 — 지방세법 제92조 제1항", () => {
  it("1,400만원 이하는 0.6%", () => {
    expect(taxOn(10_000_000)).toBe(60_000);
    expect(taxOn(14_000_000)).toBe(84_000);
  });

  it("구간마다 누적액 + 초과분", () => {
    expect(taxOn(30_000_000)).toBe(324_000); // 84,000 + 1,600만 × 1.5%
    expect(taxOn(60_000_000)).toBe(864_000); // 624,000 + 1,000만 × 2.4%
    expect(taxOn(100_000_000)).toBe(1_956_000); // 1,536,000 + 1,200만 × 3.5%
  });

  it("여덟 구간이다", () => {
    expect(BRACKETS).toHaveLength(8);
    expect(BRACKETS[0].rate).toBe(0.006);
    expect(BRACKETS[7].rate).toBe(0.045);
  });

  it("구간 세율을 읽는다", () => {
    expect(bracketPercent(10_000_000)).toBeCloseTo(0.6, 6);
    expect(bracketPercent(2_000_000_000)).toBeCloseTo(4.5, 6);
  });
});

describe("소득세와의 관계", () => {
  it("같은 과세표준에서 소득세의 정확히 10분의 1이다", () => {
    // 세액공제·감면이 없는 상태에서는 두 값이 정확히 10:1 이다.
    // 공제가 끼면 갈리므로, 우리 글은 "소득세액의 10%" 라고 쓰지 않는다.
    for (const base of [10_000_000, 30_000_000, 60_000_000, 100_000_000]) {
      expect(taxOn(base) * 10, `${base}`).toBe(incomeTaxOn(base));
    }
  });
});

describe("분할납부 — 제95조 제4항", () => {
  it("100만원을 넘어야 나눌 수 있다", () => {
    expect(INSTALLMENT.over).toBe(1_000_000);
    expect(canInstall(1_000_000)).toBe(false);
    expect(canInstall(1_000_001)).toBe(true);
  });

  it("기한 후 2개월이다", () => {
    expect(INSTALLMENT.months).toBe(2);
  });
});

describe("근거", () => {
  it("세율표가 조문 표에서 왔음을 밝힌다", () => {
    expect(r.localIncomeTax.ratesArticle).toContain("제92조");
    expect(r.localIncomeTax.ratesArticle).toContain("(표)");
  });

  it("조례로 50% 가감할 수 있다는 것을 적어 뒀다", () => {
    expect(r.localIncomeTax.ordinanceRange.rate).toBe(0.5);
  });

  it("아직 안 읽은 것을 적어 뒀다", () => {
    expect(r.localIncomeTax.notVerified.join(" ")).toMatch(/특별징수/);
  });
});
