/**
 * 정기예금 이자 — 2026-10-18 roberin 예금이자계산기와 같은 입력으로 대조한 값을 고정한다.
 * 세금 끝수(소득세·지방소득세 각각 10원 미만 버림)는 100만원 2% 1개월(이자 1,666원 → 세금 250원)에서 갈린다.
 */
import { describe, it, expect } from "vitest";
import { depositInterest, simpleInterest, monthlyCompoundInterest, depositTax, INTEREST_RATE, LOCAL_RATIO, THRESHOLD } from "../deposit";
import r from "../../rates/deposit-2026.json";

const base = { principal: 10_000_000, ratePct: 3.5, months: 12, method: "simple", tax: "normal" } as const;

describe("정기예금 이자", () => {
  it("세율은 financial-income rates(14% · 10%), 기준 2천만원", () => {
    expect(INTEREST_RATE).toBe(0.14);
    expect(LOCAL_RATIO).toBe(0.1);
    expect(THRESHOLD).toBe(20_000_000);
    expect(r.sources.map((s) => s.url).join(" ")).toContain("국고금관리법/제47조");
  });

  it("1천만원 3.5% 12개월 단리 — 이자 35만, 세금 53,900, 만기 10,296,100", () => {
    const x = depositInterest(base);
    expect(x.grossInterest).toBe(350_000);
    expect(x.incomeTax).toBe(49_000);
    expect(x.localTax).toBe(4_900);
    expect(x.tax).toBe(53_900);
    expect(x.netInterest).toBe(296_100);
    expect(x.maturity).toBe(10_296_100);
    expect(x.rows).toHaveLength(12);
    expect(x.rows[11].interest).toBe(350_000);
  });

  it("같은 조건 월복리 — 이자 355,669, 세금 54,760, 만기 10,300,909", () => {
    const x = depositInterest({ ...base, method: "monthly" });
    expect(x.grossInterest).toBe(355_669);
    expect(x.tax).toBe(54_760);
    expect(x.maturity).toBe(10_300_909);
    expect(x.simpleInterest).toBe(350_000);
    expect(x.monthlyInterest).toBe(355_669);
  });

  it("작은 값: 100만원 2% 1개월 — 이자 1,666, 소득세 230 + 지방 20 = 250", () => {
    const x = depositInterest({ ...base, principal: 1_000_000, ratePct: 2, months: 1 });
    expect(x.grossInterest).toBe(1_666);
    expect(x.incomeTax).toBe(230);
    expect(x.localTax).toBe(20);
    expect(x.netInterest).toBe(1_416);
  });

  it("5천만원 4% 36개월 월복리 — 이자 6,363,593, 세금 979,990", () => {
    const x = depositInterest({ ...base, principal: 50_000_000, ratePct: 4, months: 36, method: "monthly" });
    expect(x.grossInterest).toBe(6_363_593);
    expect(x.tax).toBe(979_990);
    expect(x.maturity).toBe(55_383_603);
  });

  it("끝수 있는 이율: 12,345,678원 3.33% 7개월 단리 — 이자 239,814, 세금 36,920", () => {
    const x = depositInterest({ ...base, principal: 12_345_678, ratePct: 3.33, months: 7 });
    expect(x.grossInterest).toBe(239_814);
    expect(x.tax).toBe(36_920);
  });

  it("비과세는 세금 0", () => {
    const x = depositInterest({ ...base, tax: "free" });
    expect(x.tax).toBe(0);
    expect(x.maturity).toBe(10_350_000);
  });

  it("이자가 10원 미만이면 세금 0(전액 버림)", () => {
    expect(depositTax(70, "normal")).toEqual({ incomeTax: 0, localTax: 0 });
  });

  it("부동소수점: 1억 1.1% 12개월 단리는 정확히 110만", () => {
    expect(simpleInterest(100_000_000, 1.1, 12)).toBe(1_100_000);
    expect(monthlyCompoundInterest(0, 3, 12)).toBe(0);
  });

  it("세전 이자 2천만원 초과면 금융소득종합과세 안내", () => {
    expect(depositInterest({ ...base, principal: 500_000_000, ratePct: 4.5 }).overThreshold).toBe(true);
    expect(depositInterest({ ...base, principal: 100_000_000 }).overThreshold).toBe(false);
  });
});
