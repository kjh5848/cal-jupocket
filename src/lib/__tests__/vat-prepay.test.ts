/**
 * 예정고지 계산 — 조문의 순서를 지키는지 본다.
 *
 * 이 파일이 지키는 것은 자릿수가 아니라 **순서**다. 50% → 1천원 절사 →
 * 50만원 판정. 순서를 바꾸면 고지가 나오고 안 나오는 경계가 움직인다.
 */
import { describe, it, expect } from "vitest";
import {
  noticeAmount,
  noticeThresholdTax,
  isCorporateNoticeSubject,
  oneThirdLine,
  qualifiesBySlump,
  noticeRate,
  noCollectionUnder,
  corporateSupplyThreshold,
  periods,
} from "../vat-prepay";
import r from "../../rates/vat-prepay-2026.json";

describe("예정고지세액 — 제48조 제3항", () => {
  it("직전 납부세액의 50%다", () => {
    expect(noticeRate).toBe(0.5);
    expect(noticeAmount(4_000_000).amount).toBe(2_000_000);
  });

  it("1천원 미만 단수는 버린다", () => {
    // 3,401,999 × 50% = 1,700,999.5 → 1,700,000
    const r1 = noticeAmount(3_401_999);
    expect(r1.halved).toBe(1_700_999.5);
    expect(r1.amount).toBe(1_700_000);
  });

  it("절사는 내림이지 반올림이 아니다", () => {
    // 1,999,000 × 50% = 999,500 → 999,000 (반올림이면 1,000,000 이 된다)
    expect(noticeAmount(1_999_000).amount).toBe(999_000);
  });

  it("50만원 미만이면 고지서가 나오지 않는다", () => {
    expect(noCollectionUnder).toBe(500_000);
    expect(noticeAmount(999_000).amount).toBe(499_000);
    expect(noticeAmount(999_000).collected).toBe(false);
  });

  it("경계는 직전 납부세액 100만원이다", () => {
    expect(noticeThresholdTax()).toBe(1_000_000);
    expect(noticeAmount(1_000_000).amount).toBe(500_000);
    expect(noticeAmount(1_000_000).collected).toBe(true);
  });

  it("직전에 낸 세금이 없으면 고지도 없다", () => {
    expect(noticeAmount(0).amount).toBe(0);
    expect(noticeAmount(0).collected).toBe(false);
  });
});

describe("법인사업자 기준 — 시행령 제90조 제4항", () => {
  it("직전 과세기간 공급가액 1억5천만원 미만이면 예정고지 대상이다", () => {
    expect(corporateSupplyThreshold).toBe(150_000_000);
    expect(isCorporateNoticeSubject(149_999_999)).toBe(true);
  });

  it("1억5천만원이면 미만이 아니다 — 예정신고 의무자다", () => {
    expect(isCorporateNoticeSubject(150_000_000)).toBe(false);
  });
});

describe("예정신고 전환 — 시행령 제90조 제6항 제1호", () => {
  it("직전의 3분의 1에 미달해야 한다", () => {
    expect(oneThirdLine(9_000_000)).toBe(3_000_000);
    expect(qualifiesBySlump(9_000_000, 2_999_999)).toBe(true);
  });

  it("정확히 3분의 1이면 미달이 아니다", () => {
    expect(qualifiesBySlump(9_000_000, 3_000_000)).toBe(false);
  });
});

describe("일정 — 법 제48조 제1항 표 · 시행령 제90조 제5항 표", () => {
  it("2기 예정신고기간은 7월 1일부터 9월 30일까지다", () => {
    const p2 = periods.find((p) => p.period === 2)!;
    expect(p2.coverage).toBe("7월 1일부터 9월 30일까지");
    expect(p2.returnDeadline).toBe("10월 25일");
    expect(p2.noticeIssued).toBe("10월 1일부터 10월 10일까지");
  });

  it("두 기수 모두 있다", () => {
    expect(periods).toHaveLength(2);
  });
});

describe("검증 기록", () => {
  it("모든 출처에 URL 이 있다", () => {
    expect(r.sources.length).toBeGreaterThanOrEqual(3);
    for (const s of r.sources) expect(s.url).toMatch(/^https:\/\/www\.law\.go\.kr\//);
  });

  it("확인하지 못한 것을 비워 두지 않는다 — 미납 가산세가 그 칸이다", () => {
    expect(r.notVerified.length).toBeGreaterThan(0);
    expect(r.notVerified.join(" ")).toContain("가산세");
  });
});
