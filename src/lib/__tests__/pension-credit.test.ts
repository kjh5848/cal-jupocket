import { describe, it, expect } from "vitest";
import { eligibleAmount, pensionCredit, SAVINGS_CAP, COMBINED_CAP } from "../pension-credit";

/**
 * 소득세법 제59조의3 — 2026-10-12 원문 재확인.
 *
 * 구글 관련 질문에 그대로 뜨는 두 조합을 박아 둔다.
 * "연금저축 600만원과 IRP 300만원을 납입하면?" / "연금저축에만 900만원이면?"
 */
describe("연금계좌세액공제 대상 금액", () => {
  it("한도는 600만원과 900만원이다", () => {
    expect(SAVINGS_CAP).toBe(6_000_000);
    expect(COMBINED_CAP).toBe(9_000_000);
  });

  it("연금저축 600 + IRP 300 이면 900 전부", () => {
    expect(eligibleAmount({ savings: 6_000_000, irp: 3_000_000 })).toBe(9_000_000);
  });

  it("연금저축에만 900 이면 600만 센다", () => {
    expect(eligibleAmount({ savings: 9_000_000, irp: 0 })).toBe(6_000_000);
  });

  it("IRP 에만 900 이면 900 전부", () => {
    expect(eligibleAmount({ savings: 0, irp: 9_000_000 })).toBe(9_000_000);
  });

  it("연금저축 600 을 넘긴 몫으로 IRP 한도를 잡아먹지 않는다", () => {
    // 연금저축 800 + IRP 300 → 600 + 300 = 900. 연금저축 초과 200 은 없는 것.
    expect(eligibleAmount({ savings: 8_000_000, irp: 3_000_000 })).toBe(9_000_000);
    // 연금저축 800 + IRP 100 → 600 + 100 = 700
    expect(eligibleAmount({ savings: 8_000_000, irp: 1_000_000 })).toBe(7_000_000);
  });

  it("ISA 만기 전환은 10% 와 300만원 중 적은 금액을 더한다", () => {
    expect(eligibleAmount({ savings: 6_000_000, irp: 3_000_000, isaTransfer: 20_000_000 })).toBe(11_000_000);
    expect(eligibleAmount({ savings: 6_000_000, irp: 3_000_000, isaTransfer: 50_000_000 })).toBe(12_000_000);
  });

  it("음수는 받지 않는다", () => {
    expect(() => eligibleAmount({ savings: -1, irp: 0 })).toThrow();
  });
});

describe("공제액", () => {
  it("900만원 · 15% → 소득세 135만 · 지방소득세 포함 148.5만", () => {
    expect(pensionCredit({ savings: 6_000_000, irp: 3_000_000 }, true)).toEqual({
      eligible: 9_000_000,
      incomeTax: 1_350_000,
      withLocal: 1_485_000,
    });
  });

  it("900만원 · 12% → 소득세 108만 · 지방소득세 포함 118.8만", () => {
    expect(pensionCredit({ savings: 6_000_000, irp: 3_000_000 }, false).withLocal).toBe(1_188_000);
  });

  it("연금저축에만 900 넣으면 15% 기준 99만원으로 줄어든다", () => {
    expect(pensionCredit({ savings: 9_000_000, irp: 0 }, true).withLocal).toBe(990_000);
  });
});
