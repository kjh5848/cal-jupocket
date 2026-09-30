/**
 * 세금계산서 발급시기 — "다음 달 10일" 이 조건부라는 것을 지킨다.
 *
 * 이 글에서 가장 쉽게 무너지는 곳이다. 널리 "10일까지 끊으면 된다" 로
 * 알려져 있어서, 다음 사람이 rates 를 고칠 때 조건 세 가지를 지우고
 * 기한만 남기기 쉽다. 그러면 건별 거래를 미뤄도 되는 것처럼 읽힌다.
 */
import { describe, it, expect } from "vitest";
import r from "../../rates/vat-2026.json";
import p from "../../rates/vat-penalty-2026.json";

const T = r.taxInvoice;

describe("발급시기 — 부가가치세법 제34조", () => {
  it("원칙은 공급시기다", () => {
    expect(T.issueTiming.principle).toContain("공급시기");
    expect(T.issueTiming.principleArticle).toContain("제34조 제1항");
  });

  it("다음 달 10일에는 조건이 세 가지 달려 있다", () => {
    expect(T.issueTiming.extendedTo).toContain("다음 달 10일");
    expect(T.issueTiming.extendedCases).toHaveLength(3);
    expect(T.issueTiming.extendedArticle).toContain("제3항");
  });

  it("세 조건이 모두 작성 연월일로 갈린다", () => {
    // 이게 이 조문의 핵심이다. 조건에서 "작성 연월일" 이 빠지면
    // 그냥 "10일까지" 가 되어 버린다.
    for (const c of T.issueTiming.extendedCases)
      expect(c, c.slice(0, 20)).toContain("작성 연월일");
  });

  it("10일이 토·공휴일이면 다음 영업일이다", () => {
    expect(T.issueTiming.extendedHoliday).toContain("영업일");
    expect(T.issueTiming.extendedAmended).toBe("2023. 12. 31.");
  });

  it("미리 발급하는 것은 막지 않는다", () => {
    expect(T.issueTiming.earlyAllowed).toContain("전");
    expect(T.issueTiming.earlyArticle).toContain("제2항");
  });
});

describe("가산세와 맞물린다", () => {
  it("지연발급 1% · 미발급 2% — 공급가액 기준", () => {
    expect(p.taxInvoice.lateIssue).toBe(0.01);
    expect(p.taxInvoice.notIssued).toBe(0.02);
  });

  it("발급과 전송이 별개라는 것이 적혀 있다", () => {
    expect(T.electronic.note).toContain("별개");
    expect(p.taxInvoice.eTransmitLate).toBe(0.003);
    expect(p.taxInvoice.eTransmitNone).toBe(0.005);
  });
});

describe("역발행과 매입자발행을 섞지 않는다", () => {
  it("조문에 있는 것은 매입자발행이고 세무서장 확인이 필요하다", () => {
    expect(T.buyerIssued.how).toContain("세무서장");
    expect(T.buyerIssued.article).toContain("제34조의2");
  });

  it("역발행과 다르다는 것을 적어 뒀다", () => {
    // 검색어는 "역발행" 인데 조문은 매입자발행이다. 둘을 같은 것으로
    // 쓰면 세무서장 확인 없이도 되는 것처럼 읽힌다.
    expect(T.buyerIssued.note).toContain("역발행");
    expect(T.buyerIssued.note).toContain("다르다");
  });
});

describe("아직 안 읽은 것", () => {
  it("시행령에 넘긴 것들을 적어 뒀다", () => {
    const s = T.notVerified.join(" ");
    expect(s).toMatch(/개인사업자/);
    expect(s).toMatch(/전송 기한/);
    expect(s).toMatch(/수정세금계산서/);
  });
});
