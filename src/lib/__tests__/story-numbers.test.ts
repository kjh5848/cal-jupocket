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
