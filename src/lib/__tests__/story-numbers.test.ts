/**
 * 스토리 글에 쓰는 숫자는 계산 함수에서 나온다.
 *
 * 스토리 형식(가상 인물 + 실제 손해액)을 쓰기로 하면서 새로 생긴 위험이
 * 하나 있다 — **인물이 가상이면 숫자도 가상이라고 착각하기 쉽다.**
 * 스레드 본문에 손으로 적은 금액이 들어가면 검증 규칙 밖으로 새어나간다.
 *
 * 그래서 스토리에 쓸 금액을 여기에 박아 두고 계산 함수와 대조한다.
 * 큐 글은 이 파일이 통과한 값만 쓴다.
 */
import { describe, it, expect } from "vitest";
import { computeGift, taxFreeCeiling } from "../gift";
import { taxSaved } from "../deduction";
import { isPaymentExempt } from "../vat";
import { noticeAmount, oneThirdLine } from "../vat-prepay";

describe("스토리 001 — 1년 차이로 갈린 증여세", () => {
  /*
   * 아버지가 9년 전에 5천만원, 올해 또 5천만원.
   * 증여재산공제는 10년 합산 한도라 두 번째 5천만원은 공제가 남아 있지 않다.
   */
  const 올해받은돈 = 50_000_000;
  const 직전10년내받은돈 = 50_000_000;

  it("10년 안에 또 받으면 485만원이 나온다", () => {
    const r = computeGift({
      amount: 올해받은돈,
      relation: "ascendant",
      usedWithin10y: 직전10년내받은돈,
    });
    expect(r.payable).toBe(4_850_000);
  });

  it("10년을 넘겨 받으면 0원이다 — 이야기의 반전이 여기다", () => {
    const r = computeGift({
      amount: 올해받은돈,
      relation: "ascendant",
      usedWithin10y: 0,
    });
    expect(r.payable).toBe(0);
  });

  it("직계존속 공제 한도가 5천만원이다", () => {
    expect(taxFreeCeiling("ascendant")).toBe(50_000_000);
  });
});

describe("스토리 002 — 한 살 차이로 못 받은 경로우대", () => {
  /* 어머니가 69세. 60세를 넘겨 기본공제는 받지만 경로우대는 70세부터다. */
  it("경로우대 100만원을 더 받으면 과세표준 5,000만원에서 세금이 얼마 줄나", () => {
    const r = taxSaved(50_000_000, 1_000_000);
    expect(r.national).toBe(150_000);
    // 지방소득세 10% 까지가 실제로 덜 내는 금액이다.
    expect(r.total).toBe(165_000);
  });
});

describe("스토리 003 — 부녀자와 한부모는 더하지 않는다", () => {
  /* 제51조 제1항 단서. 둘 다 해당되면 한부모만 적용한다. */
  it("둘을 더해 150만원으로 잡으면 50만원을 더 공제한 셈이 된다", () => {
    const r = taxSaved(50_000_000, 500_000);
    expect(r.national).toBe(75_000);
    expect(r.total).toBe(82_500);
  });
});

describe("스토리 004 — 4,800만원 경계", () => {
  /* 간이과세자는 공급대가 4,800만원 미만이면 납부의무가 면제된다. */
  it("4,790만원이면 면제, 4,810만원이면 낸다", () => {
    expect(isPaymentExempt(47_900_000)).toBe(true);
    expect(isPaymentExempt(48_100_000)).toBe(false);
  });
});

describe("스토리 005 — 3.3%와 8.8%", () => {
  /* 같은 일인데 사업소득이냐 기타소득이냐로 원천징수율이 갈린다. */
  it("1,000만원에서 뗄 금액이 다르다", () => {
    expect(Math.round(10_000_000 * 0.033)).toBe(330_000);
    expect(Math.round(10_000_000 * 0.088)).toBe(880_000);
  });
});

describe("스토리 006 — 고지서가 오지 않은 이유", () => {
  /*
   * 직전 과세기간에 90만원을 냈다. 절반은 45만원이고, 50만원 미만이라
   * 고지서가 나오지 않는다. 100만원을 냈어야 딱 경계다.
   */
  it("직전 90만원이면 45만원이라 고지되지 않는다", () => {
    const r = noticeAmount(900_000);
    expect(r.amount).toBe(450_000);
    expect(r.collected).toBe(false);
  });

  it("직전 100만원이면 50만원이 고지된다 — 여기가 경계다", () => {
    const r = noticeAmount(1_000_000);
    expect(r.amount).toBe(500_000);
    expect(r.collected).toBe(true);
  });
});

describe("스토리 007 — 매출이 꺾였는데 고지서는 그대로", () => {
  /*
   * 상반기에 420만원을 냈으니 고지서는 그 절반인 210만원이다.
   * 하반기 납부세액이 3분의 1(140만원)에 미달하면 예정신고로 바꿀 수 있다.
   */
  it("직전 420만원이면 210만원이 고지된다", () => {
    expect(noticeAmount(4_200_000).amount).toBe(2_100_000);
  });

  it("3분의 1 선은 140만원이다", () => {
    expect(oneThirdLine(4_200_000)).toBe(1_400_000);
  });
});
