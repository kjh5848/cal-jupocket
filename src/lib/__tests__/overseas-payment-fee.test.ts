import { describe, expect, it } from "vitest";
import { compareMethods, roundWon } from "../overseas-payment-fee";

const usd = {
  amount: 100,
  unit: 1,
  base: 1359.6,
  cash: { rate: 1383.39, prefPct: 90 },
  card: { rate: 1372.9, brandPct: 1.1, servicePct: 0.2 },
  dccPct: 5,
  prepaid: {},
};

const get = (r: ReturnType<typeof compareMethods>, m: string) => {
  if (!r.ok) throw new Error(r.reason);
  return r.methods.find((x) => x.method === m)!;
};

describe("해외결제·환전 수수료", () => {
  it("100달러 — 기준·현금(우대 90%)·카드(표준약관 제27조 ③)·원화결제·충전 카드", () => {
    const r = compareMethods(usd);
    if (!r.ok) throw new Error(r.reason);
    expect(r.baseWon).toBe(135_960);
    expect(get(r, "cash").won).toBe(136_198); // 1,359.60 + 23.79 × 10%
    expect(get(r, "card").card).toEqual({ principal: 137_290, brand: 1_510, service: 275 });
    expect(get(r, "card").won).toBe(139_075);
    expect(get(r, "dcc").won).toBe(146_029); // 139,075 + 6,953.75 반올림
    expect(get(r, "dcc").parts).toEqual({ rate: 1_330, fee: 1_785, dcc: 6_954 });
    expect(get(r, "prepaid").won).toBe(135_960);
    expect(r.cheapest).toBe("prepaid");
  });

  it("우대율 0% 는 현찰 살 때 환율 그대로, 100% 는 매매기준율 그대로(KB국민은행 안내)", () => {
    expect(get(compareMethods({ ...usd, cash: { rate: 1383.39, prefPct: 0 } }), "cash").won).toBe(138_339);
    expect(get(compareMethods({ ...usd, cash: { rate: 1383.39, prefPct: 100 } }), "cash").won).toBe(135_960);
  });

  it("엔화는 100엔 단위 환율 — 5,000엔 × 860.32 ÷ 100", () => {
    const r = compareMethods({ amount: 5000, unit: 100, base: 860.32, prepaid: {} });
    if (!r.ok) throw new Error(r.reason);
    expect(r.baseWon).toBe(43_016);
  });

  it("충전 카드 결제 수수료와 충전 환율", () => {
    const p = get(compareMethods({ amount: 100, unit: 1, base: 1359.6, prepaid: { rate: 1365, feePct: 1 } }), "prepaid");
    expect(p.won).toBe(136_500 + 1_365);
    expect(p.parts).toEqual({ rate: 540, fee: 1_365, dcc: 0 });
  });

  it("원화결제는 카드 조건이 있어야 계산하고, 현금이 가장 싸면 현금", () => {
    const r = compareMethods({ amount: 100, unit: 1, base: 1359.6, cash: { rate: 1383.39, prefPct: 90 }, dccPct: 5 });
    if (!r.ok) throw new Error(r.reason);
    expect(r.methods.map((m) => m.method)).toEqual(["cash"]);
    expect(r.cheapest).toBe("cash");
  });

  it("잘못된 입력", () => {
    expect(compareMethods({ ...usd, amount: 0 })).toEqual({ ok: false, reason: "amount" });
    expect(compareMethods({ ...usd, unit: 10 })).toEqual({ ok: false, reason: "unit" });
    expect(compareMethods({ ...usd, base: 0 })).toEqual({ ok: false, reason: "base" });
    expect(compareMethods({ ...usd, cash: { rate: 1300, prefPct: 0 } })).toEqual({ ok: false, reason: "cash-rate" });
    expect(compareMethods({ ...usd, cash: { rate: 1383.39, prefPct: 120 } })).toEqual({ ok: false, reason: "pref" });
    expect(compareMethods({ ...usd, dccPct: -1 })).toEqual({ ok: false, reason: "pct" });
    expect(compareMethods({ amount: 100, unit: 1, base: 1359.6 })).toEqual({ ok: false, reason: "cash-rate" });
  });

  it("부동소수 꼬리를 걷고 반올림", () => {
    expect(roundWon(1510.19)).toBe(1510);
    expect(roundWon(0.5)).toBe(1);
    expect(roundWon(274.58)).toBe(275);
  });
});
