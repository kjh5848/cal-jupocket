/**
 * 일본 国民年金 保険料 — 日本年金機構 国民年金保険料·付加保険料の納付·国民年金保険料の前納(令和8年度, 2026-10-20 확인).
 * 前納 표는 옮겨 적은 금액이라, "毎月納付 합계 − 納付額 = 표의 割引額" 을 셀마다 손계산으로 대조한다.
 */
import { describe, it, expect } from "vitest";
import {
  MONTHLY,
  NEXT_YEAR_MONTHLY,
  ADD_ON,
  FULL_BASIC_PENSION,
  premiumBaseline,
  addOnBaseline,
  payment,
  addOnPension,
  addOnPaid,
  type Plan,
  type Method,
} from "../jp/national-pension";

describe("정액 (令和8年度)", () => {
  it("月額 17,920円 · 付加 400円 · 令和9年度 18,290円", () => {
    expect(MONTHLY).toBe(17920);
    expect(ADD_ON).toBe(400);
    expect(NEXT_YEAR_MONTHLY).toBe(18290);
  });
});

describe("割引 비교 기준", () => {
  it("2年前納: 17,920 × 12 + 18,290 × 12 = 434,520円 (원문 留意点)", () => {
    expect(premiumBaseline("twoYear")).toBe(434520);
  });
  it("1年 215,040 · 6カ月 107,520 · 1カ月 17,920", () => {
    expect(premiumBaseline("oneYear")).toBe(215040);
    expect(premiumBaseline("sixMonth")).toBe(107520);
    expect(premiumBaseline("early")).toBe(17920);
  });
  it("付加: 400 × 24 · 12 · 6", () => {
    expect(addOnBaseline("twoYear")).toBe(9600);
    expect(addOnBaseline("oneYear")).toBe(4800);
    expect(addOnBaseline("sixMonth")).toBe(2400);
  });
});

describe("前納 표 대조 (기준 − 納付額 = 割引額)", () => {
  const plans: Plan[] = ["twoYear", "oneYear", "sixMonth", "early", "monthly"];
  const methods: Method[] = ["slip", "debit"];
  for (const m of methods) {
    for (const p of plans) {
      const r = payment(p, m, true);
      if (!r) continue;
      it(`${m} ${p}`, () => {
        expect(premiumBaseline(p) - r.premium).toBe(r.premiumDiscount);
        expect(addOnBaseline(p) - r.addOn).toBe(r.addOnDiscount);
      });
    }
  }
  it("원문 금액: 2年前納 納付書 418,510 (割引 16,010) · 口座振替 417,150 (割引 17,370)", () => {
    expect(payment("twoYear", "slip", false)).toMatchObject({ premium: 418510, discount: 16010, months: 24 });
    expect(payment("twoYear", "debit", false)).toMatchObject({ premium: 417150, discount: 17370 });
  });
  it("付加 포함: 1年前納 口座振替 210,530 + 4,700 = 215,230, 割引 4,510 + 100", () => {
    expect(payment("oneYear", "debit", true)).toMatchObject({ total: 215230, discount: 4610 });
  });
  it("早割은 口座振替만: 納付書면 null, 口座振替 17,860 (割引 60), 付加는 400 그대로", () => {
    expect(payment("early", "slip", true)).toBeNull();
    expect(payment("early", "debit", true)).toMatchObject({ premium: 17860, addOn: 400, total: 18260, discount: 60 });
  });
  it("付加를 안 내면 0", () => {
    expect(payment("sixMonth", "slip", false)).toMatchObject({ addOn: 0, total: 106650, discount: 870 });
  });
});

describe("付加年金", () => {
  it("원문 예시: 200円 × 480月 = 96,000円, 847,300 + 96,000 = 943,300円", () => {
    expect(addOnPension(480)).toBe(96000);
    expect(FULL_BASIC_PENSION + addOnPension(480)).toBe(943300);
  });
  it("2年 受け取ると 納付額 이상: 400 × 480 = 192,000 = 96,000 × 2", () => {
    expect(addOnPaid(480)).toBe(192000);
    expect(addOnPension(480) * 2).toBe(addOnPaid(480));
  });
  it("음수·소수 월수는 버림", () => {
    expect(addOnPension(-3)).toBe(0);
    expect(addOnPension(12.7)).toBe(2400);
  });
});
