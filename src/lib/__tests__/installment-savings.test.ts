/**
 * 정기적금 이자 — 2026-10-19 roberin 적금 만기 수령액 계산기(#40)와 같은 입력으로 대조한 값을 고정한다.
 * 세금 끝수(소득세·지방소득세 각각 10원 미만 버림)는 123,457원 2.95% 19개월(이자 57,664 → 세금 8,870)에서 갈린다.
 */
import { describe, it, expect } from "vitest";
import { installmentSavings, savingsSimpleInterest, savingsMonthlyInterest } from "../installment-savings";
import r from "../../rates/installment-savings-2026.json";

const base = { monthly: 500_000, ratePct: 3.5, months: 12, method: "simple", tax: "normal" } as const;

describe("정기적금 이자", () => {
  it("rates 에 약관 원문과 세금 법령이 있다", () => {
    const urls = r.sources.map((s) => s.url).join(" ");
    expect(urls).toContain("소득세법/제129조");
    expect(urls).toContain("국고금관리법/제47조");
    expect(r.sources.some((s) => s.label.includes("적립식예금약관"))).toBe(true);
  });

  it("50만원 3.5% 12개월 단리 — 이자 113,750, 세금 17,510, 만기 6,096,240 (roberin 같음)", () => {
    const x = installmentSavings(base);
    expect(x.principal).toBe(6_000_000);
    expect(x.grossInterest).toBe(113_750);
    expect(x.incomeTax).toBe(15_920);
    expect(x.localTax).toBe(1_590);
    expect(x.tax).toBe(17_510);
    expect(x.netInterest).toBe(96_240);
    expect(x.maturity).toBe(6_096_240);
  });

  it("같은 조건 월복리 — 이자 114,975, 세금 17,690 (roberin 같음)", () => {
    const x = installmentSavings({ ...base, method: "monthly" });
    expect(x.grossInterest).toBe(114_975);
    expect(x.tax).toBe(17_690);
    expect(x.netInterest).toBe(97_285);
  });

  it("30만원 4% 30개월 — 단리 465,000(세금 71,610) · 월복리 480,339(세금 73,960) (roberin 같음)", () => {
    const s = installmentSavings({ ...base, monthly: 300_000, ratePct: 4, months: 30 });
    expect(s.grossInterest).toBe(465_000);
    expect(s.tax).toBe(71_610);
    const m = installmentSavings({ ...base, monthly: 300_000, ratePct: 4, months: 30, method: "monthly" });
    expect(m.grossInterest).toBe(480_339);
    expect(m.tax).toBe(73_960);
  });

  it("작은 값·끝수: 123,457원 2.95% 19개월 단리 — 이자 57,664, 세금 8,870 (roberin 같음)", () => {
    const x = installmentSavings({ ...base, monthly: 123_457, ratePct: 2.95, months: 19 });
    expect(x.principal).toBe(2_345_683);
    expect(x.grossInterest).toBe(57_664);
    expect(x.tax).toBe(8_870);
  });

  it("비과세: 10만원 5% 6개월 — 이자 8,750 그대로 (roberin 같음)", () => {
    const x = installmentSavings({ ...base, monthly: 100_000, ratePct: 5, months: 6, tax: "free" });
    expect(x.grossInterest).toBe(8_750);
    expect(x.tax).toBe(0);
    expect(x.maturity).toBe(608_750);
  });

  it("3.33% 같은 소수 이율: 100만원 36개월 월복리 — 1,909,421, 세금 294,040 (roberin 같음)", () => {
    const x = installmentSavings({ ...base, monthly: 1_000_000, ratePct: 3.33, months: 36, method: "monthly" });
    expect(x.grossInterest).toBe(1_909_421);
    expect(x.tax).toBe(294_040);
  });

  it("회차표: 1회차는 n개월, 마지막 회차는 1개월치", () => {
    const x = installmentSavings(base);
    expect(x.rows).toHaveLength(12);
    expect(x.rows[0]).toEqual({ round: 1, monthsLeft: 12, interest: 17_500 });
    expect(x.rows[11]).toEqual({ round: 12, monthsLeft: 1, interest: 1_458 });
  });

  it("예금 환산 이율: 단리 세전이면 이율 × (n+1)/2n", () => {
    const x = installmentSavings({ ...base, tax: "free" });
    expect(x.depositEquivRate).toBeCloseTo(0.035 * 13 / 24, 10);
    expect(x.netReturn).toBeCloseTo(113_750 / 6_000_000, 10);
  });

  it("경계: 0% · 1개월 · 0원", () => {
    expect(savingsSimpleInterest(500_000, 0, 12)).toBe(0);
    expect(savingsMonthlyInterest(500_000, 0, 12)).toBe(0);
    expect(installmentSavings({ ...base, months: 1 }).grossInterest).toBe(1_458);
    const z = installmentSavings({ ...base, monthly: 0 });
    expect(z.maturity).toBe(0);
    expect(z.netReturn).toBe(0);
  });
});
