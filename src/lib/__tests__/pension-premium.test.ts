import { describe, it, expect } from "vitest";
import { compute, standardIncome } from "../pension-premium";

describe("국민연금 지역가입자 보험료", () => {
  it("공단 예시: 월소득 309만원 → 월 보험료 293,550원 (309만 × 9.5%)", () => {
    const r = compute(3_090_000);
    expect(r.standardIncome).toBe(3_090_000);
    expect(r.monthly).toBe(293_550);
    expect(r.annual).toBe(293_550 * 12);
    expect(r.capped).toBe(false);
    expect(r.floored).toBe(false);
  });

  it("상한 초과: 1,000만원 → 기준소득 상한 659만원으로 clamp, 월 626,050원", () => {
    const r = compute(10_000_000);
    expect(r.standardIncome).toBe(6_590_000);
    expect(r.monthly).toBe(626_050); // 6,590,000 × 0.095
    expect(r.capped).toBe(true);
  });

  it("하한 미만: 30만원 → 기준소득 하한 41만원으로 clamp, 월 38,950원", () => {
    const r = compute(300_000);
    expect(r.standardIncome).toBe(410_000);
    expect(r.monthly).toBe(38_950); // 410,000 × 0.095
    expect(r.floored).toBe(true);
  });

  it("기준소득월액은 천원 미만 절사한다", () => {
    expect(standardIncome(3_090_500)).toBe(3_090_000);
    expect(standardIncome(3_090_999)).toBe(3_090_000);
  });

  it("월 보험료는 10원 미만 절사한다", () => {
    // 1,234,000 × 0.095 = 117,230 (이미 10원 단위)
    expect(compute(1_234_000).monthly).toBe(117_230);
    // 1,111,000 × 0.095 = 105,545 → 10원 절사 = 105,540
    expect(compute(1_111_000).monthly).toBe(105_540);
  });

  it("상한 경계값 659만원은 clamp되지 않는다(capped=true 표시만)", () => {
    const r = compute(6_590_000);
    expect(r.standardIncome).toBe(6_590_000);
    expect(r.monthly).toBe(626_050);
    expect(r.capped).toBe(true);
  });

  it("소득 0 이하는 0을 돌려준다", () => {
    expect(compute(0).monthly).toBe(0);
    expect(compute(0).standardIncome).toBe(0);
  });
});
