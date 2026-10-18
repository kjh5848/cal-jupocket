/**
 * 대출 상환표 — 공식으로 닫히는 값과 불변식(마지막 잔액 0, 총 납부액 = 원금 + 이자 합계).
 * roberin(#25) 같은 입력 결과는 docs/calc-benchmark.md — 회차 이자를 반올림해 우리(버림)와 1~수십 원 다르다.
 */
import { describe, it, expect } from "vitest";
import { loanSchedule, levelPayment, compareMethods, type LoanMethod } from "../loan";

const run = (principal: number, months: number, ratePct: number, method: LoanMethod, graceMonths = 0) =>
  loanSchedule({ principal, months, ratePct, method, graceMonths });

describe("공식 값", () => {
  it("원리금균등 매달 내는 돈 = P·i/(1−(1+i)^−n), 원 미만 버림", () => {
    expect(levelPayment(100_000_000, 0.04 / 12, 360)).toBe(477_415); // 477,415.29
    expect(levelPayment(10_000_000, 0.05 / 12, 12)).toBe(856_074); // 856,074.82
    expect(levelPayment(300_000_000, 0.045 / 12, 360)).toBe(1_520_055); // 1,520,055.93
    expect(run(100_000_000, 360, 4, "level").firstPayment).toBe(477_415);
  });
  it("원금균등 총 이자 = P·i·(n+1)/2 (3억 4.5% 30년은 나누어떨어져 1원까지)", () => {
    expect(run(300_000_000, 360, 4.5, "principal").totalInterest).toBe(203_062_500);
  });
  it("만기일시 — 매달 이자만, 회차마다 원 미만 버림(1천만 5% 1년: 41,666원 × 12)", () => {
    const x = run(10_000_000, 12, 5, "bullet");
    expect(x.firstPayment).toBe(41_666);
    expect(x.totalInterest).toBe(41_666 * 12);
    expect(x.lastPayment).toBe(10_041_666);
  });
});

describe("불변식", () => {
  const cases: [number, number, number, LoanMethod, number][] = [
    [100_000_000, 360, 4, "level", 0],
    [10_000_000, 12, 5, "level", 0],
    [300_000_000, 360, 4.5, "level", 0],
    [10_000_000, 12, 5, "principal", 0],
    [100_000_000, 120, 4, "principal", 12],
    [100_000_000, 120, 4, "level", 12],
    [50_000_000, 60, 0, "level", 0],
    [50_000_000, 60, 0, "principal", 0],
    [50_000_000, 1, 6, "level", 0],
    [123_456_789, 37, 7.25, "level", 5],
    [1, 12, 3, "principal", 0],
  ];
  for (const [p, n, r, m, g] of cases) {
    it(`${p}원 ${n}개월 ${r}% ${m} 거치 ${g}`, () => {
      const x = run(p, n, r, m, g);
      expect(x.rows.length).toBe(n);
      expect(x.rows.at(-1)!.balance).toBe(0);
      expect(x.rows.reduce((s, v) => s + v.principal, 0)).toBe(p);
      expect(x.totalPaid).toBe(x.rows.reduce((s, v) => s + v.payment, 0));
      expect(x.totalPaid).toBe(p + x.totalInterest);
      for (const v of x.rows) {
        expect(Number.isInteger(v.payment) && v.principal >= 0 && v.interest >= 0).toBe(true);
      }
    });
  }
  it("0%면 이자 0원, 60개월 원리금균등은 833,333원씩 마지막 833,353원", () => {
    const x = run(50_000_000, 60, 0, "level");
    expect(x.totalInterest).toBe(0);
    expect(x.firstPayment).toBe(833_333);
    expect(x.lastPayment).toBe(833_353);
  });
  it("1개월이면 원금 + 한 달 이자 한 번", () => {
    expect(run(50_000_000, 1, 6, "level").lastPayment).toBe(50_250_000);
  });
});

describe("거치기간(대출기간 안에 포함)", () => {
  it("1억 4% 120개월 중 거치 12개월 원금균등 — 이자만 333,333원 12번, 그 뒤 108회 원금 925,925원", () => {
    const x = run(100_000_000, 120, 4, "principal", 12);
    expect(x.gracePayment).toBe(333_333);
    expect(x.rows.slice(0, 12).every((v) => v.principal === 0 && v.payment === 333_333)).toBe(true);
    expect(x.repayMonths).toBe(108);
    expect(x.rows[12].principal).toBe(925_925);
    expect(x.firstPayment).toBe(925_925 + 333_333);
  });
  it("거치가 대출기간 이상이면 마지막 한 회차는 원금을 갚는다", () => {
    const x = run(10_000_000, 12, 5, "principal", 12);
    expect(x.repayMonths).toBe(1);
    expect(x.lastPayment).toBe(10_000_000 + 41_666);
  });
  it("만기일시는 거치를 무시", () => {
    expect(run(10_000_000, 12, 5, "bullet", 6).totalInterest).toBe(41_666 * 12);
  });
});

describe("세 방식 비교", () => {
  it("같은 조건이면 총 이자: 원금균등 < 원리금균등 < 만기일시", () => {
    const [level, principal, bullet] = compareMethods({ principal: 100_000_000, months: 360, ratePct: 4 });
    expect(principal.totalInterest).toBeLessThan(level.totalInterest);
    expect(level.totalInterest).toBeLessThan(bullet.totalInterest);
  });
});
