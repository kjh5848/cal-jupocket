/**
 * DSR 계산 — 은행업감독규정 별표 6 제4장 4. 가목(1억 초과 40%), 세칙 별표 18 제12호·제12-2호 사목·<표 3>.
 * roberin #313 대조(2026-10-18, docs/calc-benchmark.md): 같은 입력 결과를 아래에 적고, 다른 곳은 원문으로 누가 맞는지 적는다.
 */
import { describe, it, expect } from "vitest";
import { dsr, dsrLoanAnnual, type DsrLoan } from "../dsr";

const L = (amount: number, ratePct: number, years: number, method: DsrLoan["method"] = "level", kind: DsrLoan["kind"] = "mortgage"): DsrLoan => ({
  kind,
  amount,
  ratePct,
  years,
  method,
});

describe("DSR — roberin 대조", () => {
  it("(a) 연소득 5천·주담대 3억 4% 30년 원리금균등 = 34.37% (roberin 같음 · 연 원리금 우리 원 미만 버림 17,186,950 / roberin 반올림 17,186,951 · 40% 최대 대출 349,102,067 같음)", () => {
    const x = dsr({ income: 50_000_000, newLoan: L(300_000_000, 4, 30), others: [] });
    expect(x.newAnnual.total).toBe(17_186_950);
    expect(x.dsr).toBe(34.37);
    expect(x.maxNewLoan).toBe(349_102_067);
    expect(x.regulated).toBe(true);
  });

  it("스트레스 1.5%p 를 더하면 새 대출 연 원리금 20,440,404 (roberin 같음)", () => {
    const x = dsr({ income: 50_000_000, newLoan: L(300_000_000, 4, 30), stressPct: 1.5, others: [] });
    expect(x.appliedRatePct).toBe(5.5);
    expect(x.newAnnual.total).toBe(20_440_404);
  });

  it("(b) 기간을 비운 신용대출 1천만 5% — 표 3 '분할상환 외'라 ÷5년 + 1년 이자 = 2,500,000 (roberin 은 0원으로 셈)", () => {
    const x = dsr({ income: 30_000_000, newLoan: L(100_000_000, 3, 10), others: [L(10_000_000, 5, 0, "bullet", "credit")] });
    expect(x.newAnnual.total).toBe(11_587_289); // roberin 같음
    expect(x.otherAnnual).toBe(2_500_000);
    expect(x.dsr).toBe(46.96); // roberin 38.62%
  });

  it("(c) 주담대 45년은 40년으로 잘라 셈 (세칙 별표 18 제12-2호 사목)", () => {
    const a45 = dsrLoanAnnual(L(300_000_000, 4, 45));
    const a40 = dsrLoanAnnual(L(300_000_000, 4, 40));
    expect(a45).toEqual(a40);
    expect(a45.termYears).toBe(40);
  });

  it("신용대출 분할상환 5년 2천만 6% — 원금은 대출총액 ÷ 약정만기(표 3), roberin 은 원리금균등 연액 4,639,872", () => {
    const a = dsrLoanAnnual(L(20_000_000, 6, 5, "level", "credit"));
    expect(a.principal).toBe(4_000_000);
    expect(a.total).toBe(5_103_809);
  });
});

describe("DSR — 표 3 부채산정방식", () => {
  it("주담대 일시상환은 대출총액 ÷ 최대 10년 + 1년 이자", () => {
    const a = dsrLoanAnnual(L(300_000_000, 4, 30, "bullet"));
    expect(a.principal).toBe(30_000_000);
    expect(a.interest).toBe(12_000_000);
  });
  it("신용대출 분할상환 약정만기는 5~10년으로 맞춘다", () => {
    expect(dsrLoanAnnual(L(30_000_000, 5, 3, "level", "credit")).termYears).toBe(5);
    expect(dsrLoanAnnual(L(30_000_000, 5, 15, "level", "credit")).termYears).toBe(10);
  });
  it("마이너스통장(신용 일시)은 한도 ÷ 5년 + 한도 × 금리", () => {
    expect(dsrLoanAnnual(L(50_000_000, 6, 1, "bullet", "credit")).total).toBe(13_000_000);
  });
  it("전세자금대출은 넣지 않는다", () => {
    expect(dsrLoanAnnual(L(200_000_000, 4, 2, "bullet", "jeonse")).total).toBe(0);
  });
  it("원금균등 주담대는 첫 12개월 원금 + 이자", () => {
    const a = dsrLoanAnnual(L(120_000_000, 0, 10, "principal"));
    expect(a.total).toBe(12_000_000);
  });
});

describe("DSR — 1억 초과 규제 대상", () => {
  it("총대출 1억 딱이면 대상 아님, 넘으면 대상", () => {
    expect(dsr({ income: 40_000_000, newLoan: L(100_000_000, 4, 30), others: [] }).regulated).toBe(false);
    expect(dsr({ income: 40_000_000, newLoan: L(90_000_000, 4, 30), others: [L(10_000_001, 5, 1, "bullet", "credit")] }).regulated).toBe(true);
  });
  it("기존 대출만으로 40% 를 넘으면 새 대출 최대 0원", () => {
    expect(dsr({ income: 10_000_000, newLoan: L(10_000_000, 4, 30), others: [L(50_000_000, 6, 1, "bullet", "credit")] }).maxNewLoan).toBe(0);
  });
});
