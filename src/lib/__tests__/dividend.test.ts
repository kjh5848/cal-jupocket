/**
 * 배당금 계산기 — 소득세법 제129조 ① 2호(14%)·제86조 1호(1천원 미만 부징수)·지방세법 제103조의13·국고금 관리법 제47조 ①.
 * 2026-10-23 roberin 배당금계산기(#34)에 같은 입력을 넣은 값과 대조했다(calc-benchmark). 다섯 세트 모두 원 단위까지 같다.
 */
import { describe, it, expect } from "vitest";
import { dividend, paymentTax, sharesForAnnualNet, SMALL_AMOUNT, DIVIDEND_RATE, LOCAL_RATIO } from "../dividend";

describe("rates", () => {
  it("14% · 10% · 1천원", () => {
    expect(DIVIDEND_RATE).toBe(0.14);
    expect(LOCAL_RATIO).toBe(0.1);
    expect(SMALL_AMOUNT).toBe(1000);
  });
});

describe("1회 지급분 세금", () => {
  it("7,142원은 소득세 999.88원 → 1천원 미만이라 떼지 않음(제86조 1호)", () => {
    expect(paymentTax(7142)).toMatchObject({ incomeTax: 0, localTax: 0, net: 7142, exempt: true });
  });
  it("7,143원부터 소득세 1,000원·지방소득세 100원", () => {
    expect(paymentTax(7143)).toMatchObject({ incomeTax: 1000, localTax: 100, net: 6043, exempt: false });
  });
  it("10원 미만은 소득세·지방소득세 따로 버림 — 100,050원 → 14,000 + 1,400", () => {
    expect(paymentTax(100_050)).toMatchObject({ incomeTax: 14_000, localTax: 1_400, net: 84_650 });
  });
  it("100만원 → 140,000 + 14,000", () => {
    expect(paymentTax(1_000_000).net).toBe(846_000);
  });
});

describe("roberin 대조 (2026-10-23 관찰값)", () => {
  it("분기 500원 · 100주 · 주가 6만원 · 목표 월 30만원", () => {
    const x = dividend({ perShare: 500, basis: "payment", freq: 4, shares: 100, price: 60_000, targetMonthly: 300_000 });
    expect(x.annualGross).toBe(200_000);
    expect(x.annualTax).toBe(30_800);
    expect(x.annualNet).toBe(169_200);
    expect(x.monthlyNet).toBe(14_100);
    expect(x.perPayment.net).toBe(42_300);
    expect(x.value).toBe(6_000_000);
    expect(x.grossYield!.toFixed(4)).toBe("0.0333");
    expect(x.netYield!.toFixed(4)).toBe("0.0282");
    expect(x.target).toMatchObject({ shares: 2128, invest: 127_680_000, moreShares: 2028, moreInvest: 121_680_000 });
    expect(x.target!.progress.toFixed(3)).toBe("0.047");
  });
  it("분기 500원 · 10주 — 1회 5,000원이라 세금 0원", () => {
    const x = dividend({ perShare: 500, basis: "payment", freq: 4, shares: 10 });
    expect(x.annualTax).toBe(0);
    expect(x.annualNet).toBe(20_000);
    expect(x.monthlyNet).toBe(1_666);
  });
  it("연 1회 100,050원 · 1주", () => {
    const x = dividend({ perShare: 100_050, basis: "payment", freq: 1, shares: 1 });
    expect(x.annualNet).toBe(84_650);
    expect(x.monthlyNet).toBe(7_054);
  });
  it("매월 7,143원 · 1주", () => {
    const x = dividend({ perShare: 7_143, basis: "payment", freq: 12, shares: 1 });
    expect(x.annualTax).toBe(13_200);
    expect(x.annualNet).toBe(72_516);
  });
  it("연간 합계 2,000원 · 분기 · 37주 · 주가 5만원", () => {
    const x = dividend({ perShare: 2_000, basis: "annual", freq: 4, shares: 37, price: 50_000 });
    expect(x.perPayment.gross).toBe(18_500);
    expect(x.annualTax).toBe(11_360);
    expect(x.annualNet).toBe(62_640);
    expect(x.netYield!.toFixed(4)).toBe("0.0339");
  });
});

describe("목표 역산", () => {
  it("2,128주는 닿고 2,127주는 모자람", () => {
    expect(sharesForAnnualNet(500, "payment", 4, 3_600_000)).toBe(2128);
    expect(dividend({ perShare: 500, basis: "payment", freq: 4, shares: 2127 }).annualNet).toBeLessThan(3_600_000);
  });
  it("소액 부징수 구간 근처 목표 — 세금 없는 쪽이 더 적은 주식", () => {
    // 매월 1주당 1,000원, 목표 월 7,000원: 7주면 1회 7,000원(세금 0) — 8주(8,000원, 세후 6,770원)로는 오히려 모자람
    expect(sharesForAnnualNet(1000, "payment", 12, 84_000)).toBe(7);
    expect(paymentTax(8000).net).toBeLessThan(7000);
    // 월 7,200원이면 부징수로는 못 닿아(7,142원 상한) 세금 떼는 쪽에서 찾는다
    const n = sharesForAnnualNet(1000, "payment", 12, 86_400)!;
    expect(n).toBe(9); // roberin 도 7주·9주
    expect(paymentTax(n * 1000).net).toBeGreaterThanOrEqual(7200);
    expect(paymentTax((n - 1) * 1000).net).toBeLessThan(7200);
  });
  it("가장 작은 주식 수인지 — 여러 조건에서 하나씩 줄여 확인", () => {
    for (const [ps, f, goal] of [[361, 4, 1_000_000], [87, 12, 12_000_000], [2_450, 1, 50_000_000], [3, 12, 360_000]] as const) {
      const n = sharesForAnnualNet(ps, "payment", f, goal)!;
      const net = (k: number) => paymentTax(ps * k).net * f;
      expect(net(n)).toBeGreaterThanOrEqual(goal);
      for (let k = Math.max(0, n - 300); k < n; k++) expect(net(k)).toBeLessThan(goal);
    }
  });
  // roberin 은 연 세전을 1,001 × 3 = 3,003원으로 보여 준다(1회 750원 × 4 = 3,000원과 다름) — 법령 규정 없음, 우리는 실제 지급 합계
  it("연간 합계가 지급 횟수로 안 나눠지면 1회분 원 미만 버림", () => {
    const x = dividend({ perShare: 1_001, basis: "annual", freq: 4, shares: 3 });
    expect(x.perPayment.gross).toBe(750);
    expect(x.annualGross).toBe(3_000);
  });
  it("연 세전 2천만원 넘으면 표시", () => {
    expect(dividend({ perShare: 1_000, basis: "payment", freq: 4, shares: 5_001 }).overThreshold).toBe(true);
    expect(dividend({ perShare: 1_000, basis: "payment", freq: 4, shares: 5_000 }).overThreshold).toBe(false);
  });
});
