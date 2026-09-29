/**
 * 취득세 — 6억~9억 계산식이 이 파일의 이유다.
 *
 * 세율표가 아니라 계산식이라 금액마다 세율이 다르다. 그리고 조문이
 * 반올림 자리까지 정했다 — "소수점 이하 다섯째자리에서 반올림하여
 * 소수점 넷째자리까지". 그 반올림을 빼면 몇 천원씩 어긋난다.
 *
 * 두 번째로 틀리기 쉬운 곳이 지방교육세다. 취득세액의 20% 가 아니라
 * **표준세율에서 2%를 뺀 세율**로 다시 계산한 금액의 20% 다.
 */
import { describe, it, expect } from "vitest";
import {
  housePaidRate,
  rateFor,
  educationTaxOn,
  bill,
  DEADLINE,
  STANDARD,
} from "../acquisition-tax";
import r from "../../rates/local-tax-2026.json";

const 억 = 100_000_000;

describe("주택 유상거래 세율 — 제11조 제1항 제8호", () => {
  it("6억 이하는 1%", () => {
    expect(housePaidRate(3 * 억)).toBe(0.01);
    expect(housePaidRate(6 * 억)).toBe(0.01);
  });

  it("9억 초과는 3%", () => {
    expect(housePaidRate(9 * 억 + 1)).toBe(0.03);
    expect(housePaidRate(15 * 억)).toBe(0.03);
  });

  it("계산식의 두 끝이 표준세율과 맞물린다", () => {
    // 6억을 식에 넣으면 1%, 9억을 넣으면 3% 가 나온다. 그래서
    // "6억 1원이면 세율이 갑자기 뛴다" 는 일이 없다.
    expect(housePaidRate(6 * 억)).toBeCloseTo(0.01, 6);
    expect(housePaidRate(9 * 억)).toBeCloseTo(0.03, 6);
  });

  it("7억 5천이면 정확히 2%", () => {
    // (750,000,000 × 2 ÷ 300,000,000 − 3) ÷ 100 = (5 − 3)/100 = 0.02
    expect(housePaidRate(7.5 * 억)).toBeCloseTo(0.02, 6);
  });

  it("사이 금액은 구간이 아니라 이어진다", () => {
    const a = housePaidRate(6.5 * 억);
    const b = housePaidRate(7 * 억);
    const c = housePaidRate(8 * 억);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it("소수점 넷째자리까지 반올림한다", () => {
    // 조문이 자리를 정했다. 그대로 두면 부동소수점 꼬리가 남는다.
    const v = housePaidRate(6.37 * 억);
    expect(Number.isFinite(v)).toBe(true);
    expect(String(v).replace(/^0\./, "").length).toBeLessThanOrEqual(4);
  });
});

describe("원인별 표준세율 — 제11조 제1항", () => {
  it("상속은 농지 2.3% · 그 밖 2.8%", () => {
    expect(rateFor("inheritanceFarm", 1 * 억)).toBe(0.023);
    expect(rateFor("inheritanceOther", 1 * 억)).toBe(0.028);
  });

  it("증여는 3.5%로 가장 높다", () => {
    expect(rateFor("gift", 1 * 억)).toBe(0.035);
    expect(STANDARD.gift).toBeGreaterThan(STANDARD.inheritanceOther);
  });

  it("신축(원시취득)은 2.8%", () => {
    expect(rateFor("original", 1 * 억)).toBe(0.028);
  });

  it("상가·토지 유상취득은 4%", () => {
    expect(rateFor("paidOther", 1 * 억)).toBe(0.04);
  });

  it("같은 5억 집이라도 사면 1%, 받으면 3.5%", () => {
    // 이 대비가 증여 결정에서 실제로 작동하는 숫자다.
    expect(bill({ price: 5 * 억, cause: "housePaid" }).acquisitionTax).toBe(5_000_000);
    expect(bill({ price: 5 * 억, cause: "gift" }).acquisitionTax).toBe(17_500_000);
  });
});

describe("지방교육세 — 취득세의 20%가 아니다", () => {
  it("상가 4%면 (4−2)% × 20% = 0.4%", () => {
    expect(educationTaxOn(1 * 억, "paidOther")).toBe(Math.floor(1 * 억 * 0.02 * 0.2));
    expect(educationTaxOn(1 * 억, "paidOther")).toBe(400_000);
  });

  it("주택 유상은 세율을 절반으로 줄인 뒤 20%", () => {
    // 5억 주택 1% → 1% × 50% × 20% = 0.1%
    expect(educationTaxOn(5 * 억, "housePaid")).toBe(500_000);
  });

  it("취득세액의 20%를 그대로 쓰면 틀린다", () => {
    const b = bill({ price: 5 * 억, cause: "housePaid" });
    expect(b.educationTax).not.toBe(Math.floor(b.acquisitionTax * 0.2));
  });
});

describe("신고·납부 기한 — 제20조 제1항", () => {
  it("일반 취득은 60일", () => {
    expect(DEADLINE.generalDays).toBe(60);
    expect(bill({ price: 5 * 억, cause: "housePaid" }).deadline).toContain("60일");
  });

  it("증여는 취득일이 속하는 달의 말일부터 3개월", () => {
    expect(bill({ price: 5 * 억, cause: "gift" }).deadline).toContain("3개월");
    expect(bill({ price: 5 * 억, cause: "gift" }).deadline).toContain("말일");
  });

  it("상속은 6개월 — 국외 상속인이 있으면 9개월", () => {
    const d = bill({ price: 5 * 억, cause: "inheritanceOther" }).deadline;
    expect(d).toContain("6개월");
    expect(d).toContain("9개월");
  });

  it("상속세 신고기한과 같은 6개월이지만 세는 대상이 다르다", () => {
    // 상속세(국세)도 6개월인데, 취득세는 지방세라 신고처가 다르다.
    expect(DEADLINE.inheritanceMonths).toBe(6);
  });
});

describe("아직 안 읽은 것", () => {
  it("중과세율과 감면을 스스로 적어 뒀다", () => {
    const s = r.acquisitionTax.notVerified.join(" ");
    expect(s).toMatch(/중과/);
    expect(s).toMatch(/농어촌특별세/);
    expect(s).toMatch(/감면/);
  });
});
