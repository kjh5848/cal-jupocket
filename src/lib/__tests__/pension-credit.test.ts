import { describe, it, expect } from "vitest";
import { eligibleAmount, pensionCredit, SAVINGS_CAP, COMBINED_CAP, cappedByTax, withdrawalTax, annuityRatePercent, NON_ANNUITY_RATE, roomToCap } from "../pension-credit";

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

describe("제61조 — 공제는 낼 세금을 넘지 못한다", () => {
  it("산출세액 80만원이면 135만원 공제 중 80만원만 쓴다", () => {
    expect(cappedByTax(1_350_000, 800_000)).toEqual({ used: 800_000, unused: 550_000 });
  });
  it("세금이 충분하면 다 쓴다", () => {
    expect(cappedByTax(1_350_000, 3_000_000)).toEqual({ used: 1_350_000, unused: 0 });
  });
});

describe("꺼낼 때의 세금", () => {
  it("연금외수령은 15%, 지방소득세 포함 16.5%", () => {
    expect(NON_ANNUITY_RATE).toBe(15);
    // 공제받은 원금 900만 + 수익 100만 → 1,000만 × 15% = 150만, 지방세 포함 165만
    expect(withdrawalTax({ creditedPrincipal: 9_000_000, gains: 1_000_000 }, 15)).toEqual({
      taxable: 10_000_000, incomeTax: 1_500_000, withLocal: 1_650_000,
    });
  });
  it("공제받지 않은 원금은 과세 대상에 넣지 않는다", () => {
    const r = withdrawalTax({ creditedPrincipal: 0, gains: 0, uncreditedPrincipal: 9_000_000 }, 15);
    expect(r.taxable).toBe(0);
  });
  it("연금수령 세율은 나이로 5·4·3%", () => {
    expect(annuityRatePercent(65)).toBe(5);
    expect(annuityRatePercent(70)).toBe(4);
    expect(annuityRatePercent(79)).toBe(4);
    expect(annuityRatePercent(80)).toBe(3);
  });
});

/**
 * roberin 연금저축·IRP 세액공제 계산기와 같은 입력으로 대조(2026-10-17, docs/calc-benchmark.md).
 * 15%/12% 는 사용자가 고르는 구간이라 경계(총급여 5,500만원)는 여기서 다루지 않는다.
 * 원 미만은 소득세·지방소득세 따로 버린다 — 3,333,333원·1,234,567원이 단수 경계.
 */
describe("roberin 대조 · 한도까지 남은 금액", () => {
  const total = (s: number, i: number, low: boolean) => pensionCredit({ savings: s, irp: i }, low).withLocal;
  it("같은 입력 6개가 같다", () => {
    expect(total(6_000_000, 3_000_000, true)).toBe(1_485_000);
    expect(total(6_000_000, 3_000_000, false)).toBe(1_188_000);
    expect(total(8_000_000, 1_000_000, true)).toBe(1_155_000);
    expect(total(3_333_333, 0, true)).toBe(549_998);
    expect(total(0, 12_000_000, false)).toBe(1_188_000);
    expect(total(1_234_567, 0, true)).toBe(203_703);
  });

  it("한도 넘긴 돈 · 남은 한도 · 더 줄어드는 세금", () => {
    expect(roomToCap({ savings: 8_000_000, irp: 1_000_000 }, true)).toEqual({ over: 2_000_000, room: 2_000_000, extraWithLocal: 330_000 });
    expect(roomToCap({ savings: 3_333_333, irp: 0 }, true)).toEqual({ over: 0, room: 5_666_667, extraWithLocal: 935_002 });
    expect(roomToCap({ savings: 0, irp: 12_000_000 }, false)).toEqual({ over: 3_000_000, room: 0, extraWithLocal: 0 });
    expect(roomToCap({ savings: 1_234_567, irp: 0 }, true).extraWithLocal).toBe(1_281_297);
  });

  it("남은 한도는 ISA 추가분과 따로 센다", () => {
    const r = roomToCap({ savings: 6_000_000, irp: 0, isaTransfer: 20_000_000 }, true);
    expect(r.room).toBe(3_000_000);
    expect(r.extraWithLocal).toBe(495_000);
  });

  it("산출세액 한도(제61조)에 걸리면 더 넣어도 줄지 않는다", () => {
    // 600만 × 15% = 90만 > 산출세액 50만 → 지금도 50만까지만, 더 넣어도 0
    expect(roomToCap({ savings: 6_000_000, irp: 0 }, true, 500_000).extraWithLocal).toBe(0);
    // 300만 × 15% = 45만, 산출세액 50만 → 5만 + 지방 5천만 더
    expect(roomToCap({ savings: 3_000_000, irp: 0 }, true, 500_000).extraWithLocal).toBe(55_000);
  });
});
