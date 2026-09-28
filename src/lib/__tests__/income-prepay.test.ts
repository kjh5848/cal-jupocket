/**
 * 중간예납 계산 — 조문의 순서와 경계를 지키는지 본다.
 *
 * 부가세 예정고지와 모양이 같아 헷갈리기 쉬운 자리가 셋이다 —
 * 30%(3분의 1이 아니다), 1천만원 "초과"(이상이 아니다), 기준액에서
 * 원천징수세액이 빠진다는 것.
 */
import { describe, it, expect } from "vitest";
import {
  prepayBase,
  noticeAmount,
  noticeThresholdBase,
  estimateLine,
  qualifiesByEstimate,
  maxInstallment,
  noticeRate,
  noCollectionUnder,
  estimateFraction,
  schedule,
} from "../income-prepay";
import r from "../../rates/income-prepay-2026.json";

describe("중간예납기준액 — 제65조 제7항", () => {
  it("네 가지 세액의 합계에서 환급세액을 뺀다", () => {
    expect(
      prepayBase({
        previousPrepay: 1_000_000,
        finalReturnPaid: 2_000_000,
        additionalPaid: 300_000,
        lateReturnPaid: 0,
        refund: 500_000,
      }),
    ).toBe(2_800_000);
  });

  it("5월에 추가로 낸 돈만 있으면 그것이 기준액이다", () => {
    expect(prepayBase({ finalReturnPaid: 1_200_000 })).toBe(1_200_000);
  });

  it("환급만 받았으면 기준액은 0 이다 — 음수로 가지 않는다", () => {
    expect(prepayBase({ refund: 400_000 })).toBe(0);
  });

  it("원천징수세액은 열거에 없다", () => {
    expect(r.baseComponents.join(" ")).not.toContain("원천징수");
    expect(r.baseNote).toContain("원천징수세액은 이 열거에 없다");
  });
});

describe("중간예납세액 — 제65조 제1항 · 제86조 제4호", () => {
  it("기준액의 2분의 1이다", () => {
    expect(noticeRate).toBe(0.5);
    expect(noticeAmount(3_000_000).amount).toBe(1_500_000);
  });

  it("1천원 미만 단수는 버린다", () => {
    const x = noticeAmount(1_555_000);
    expect(x.halved).toBe(777_500);
    expect(x.amount).toBe(777_000);
  });

  it("50만원 미만이면 징수하지 않는다", () => {
    expect(noCollectionUnder).toBe(500_000);
    expect(noticeAmount(999_999).amount).toBe(499_000);
    expect(noticeAmount(999_999).collected).toBe(false);
  });

  it("경계는 기준액 100만원이다", () => {
    expect(noticeThresholdBase()).toBe(1_000_000);
    expect(noticeAmount(1_000_000).amount).toBe(500_000);
    expect(noticeAmount(1_000_000).collected).toBe(true);
  });
});

describe("추계액 신고 — 제65조 제3항", () => {
  it("선은 100분의 30이다 — 3분의 1이 아니다", () => {
    expect(estimateFraction).toBe(0.3);
    expect(estimateLine(3_000_000)).toBe(900_000);
  });

  it("미달이어야 한다 — 정확히 30%는 안 된다", () => {
    expect(qualifiesByEstimate(3_000_000, 899_999)).toBe(true);
    expect(qualifiesByEstimate(3_000_000, 900_000)).toBe(false);
  });

  it("비교 대상은 세액이다", () => {
    expect(r.estimate.note).toContain("비교 대상은 소득이 아니라 세액");
  });
});

describe("분할납부 — 법 제77조 · 시행령 제140조", () => {
  it("정확히 1천만원이면 분납이 안 된다 — 초과여야 한다", () => {
    expect(maxInstallment(10_000_000)).toBe(0);
  });

  it("2천만원 이하는 1천만원을 넘는 부분", () => {
    expect(maxInstallment(15_000_000)).toBe(5_000_000);
    expect(maxInstallment(20_000_000)).toBe(10_000_000);
  });

  it("2천만원을 넘으면 절반 이하", () => {
    expect(maxInstallment(20_000_002)).toBe(10_000_001);
    expect(maxInstallment(25_000_000)).toBe(12_500_000);
  });
});

describe("일정 — 제65조 제1항·제2항·제3항", () => {
  it("고지서는 11월 1~15일, 납부는 11월 30일", () => {
    expect(schedule.noticeIssued).toBe("11월 1일부터 11월 15일까지");
    expect(schedule.paymentDeadline).toBe("11월 30일");
    expect(schedule.period).toBe("1월 1일부터 6월 30일까지");
  });

  it("분납분 재고지는 다음 연도 1월 1~15일", () => {
    expect(schedule.reissueForInstallment).toBe("다음 연도 1월 1일부터 1월 15일까지");
  });
});

describe("검증 기록", () => {
  it("모든 출처에 URL 이 있다", () => {
    expect(r.sources.length).toBeGreaterThanOrEqual(5);
    for (const s of r.sources) expect(s.url).toMatch(/^https:\/\/www\.law\.go\.kr\//);
  });

  it("확인하지 못한 것을 비워 두지 않는다 — 미납 가산세·지방소득세가 그 칸이다", () => {
    const all = r.notVerified.join(" ");
    expect(all).toContain("가산세");
    expect(all).toContain("지방소득세");
  });
});

describe("income-prepayment 카드 — 금액이 계산 함수와 같다", async () => {
  const { cardSetBySlug } = await import("../../data/cards");
  /** 카드 표기 — "155만 5천원" · "50만원" */
  const cardWon = (v: number) => {
    const man = Math.floor(v / 10_000);
    const cheon = (v % 10_000) / 1_000;
    return cheon ? `${man}만 ${cheon}천원` : `${man}만원`;
  };
  const set = cardSetBySlug("income-prepayment")!;

  it("세트가 있고 33번 글을 가리킨다", () => {
    expect(set).toBeDefined();
    const cta = set.cards[set.cards.length - 1];
    expect(cta.kind === "cta" && cta.refNo).toBe(33);
  });

  it("고지 금액 표의 금액이 noticeAmount 와 같다", () => {
    const t = set.cards.find((c) => c.kind === "table")!;
    const text = JSON.stringify(t);
    for (const base of [900_000, 1_000_000, 1_555_000, 3_000_000]) {
      const n = noticeAmount(base);
      expect(text).toContain(cardWon(base));
      expect(text).toContain(cardWon(n.amount));
    }
    expect(noticeAmount(900_000).collected).toBe(false);
  });

  it("표지의 30% 가 rates 와 같다", () => {
    const cover = set.cards[0];
    expect(cover.kind).toBe("cover");
    expect(JSON.stringify(cover)).toContain(`${estimateFraction * 100}%`);
  });
});
