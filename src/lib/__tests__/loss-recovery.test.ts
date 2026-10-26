import { describe, it, expect } from "vitest";
import { recovery, currentFromLoss, needFromLoss, recoveryMonths, formatMonths, parseCloses, series, MAX_MONTHS } from "../loss-recovery";

describe("필요 상승률 = L ÷ (1 − L)", () => {
  it("10%·30%·50%·99% 손실", () => {
    expect(needFromLoss(10)).toBeCloseTo(11.1111, 3);
    expect(needFromLoss(30)).toBeCloseTo(42.8571, 3);
    expect(needFromLoss(50)).toBeCloseTo(100, 9);
    expect(needFromLoss(99)).toBeCloseTo(9900, 6);
    expect(needFromLoss(100)).toBe(Infinity);
  });

  it("원금·평가액으로 넣어도 같다 — 1,000만원이 700만원", () => {
    const r = recovery(10_000_000, 7_000_000);
    if (!r.ok) throw new Error();
    expect(r.changePct).toBeCloseTo(-30, 9);
    expect(r.pnl).toBe(-3_000_000);
    expect(r.needPct).toBeCloseTo(needFromLoss(30), 9);
    expect(r.shortfall).toBeCloseTo(3_000_000, 6);
  });

  it("손실률 → 평가액", () => {
    expect(currentFromLoss(10_000_000, 30)).toBeCloseTo(7_000_000, 6);
    expect(currentFromLoss(10_000_000, 101)).toBeNull();
    expect(currentFromLoss(0, 10)).toBeNull();
  });
});

describe("팔 때 비용(매도 금액의 %)", () => {
  it("0.2%면 목표 평가액 = 원금 ÷ 0.998", () => {
    const r = recovery(10_000_000, 7_000_000, 0.2);
    if (!r.ok) throw new Error();
    expect(r.target).toBeCloseTo(10_000_000 / 0.998, 6);
    expect(Math.round(r.shortfall)).toBe(3_020_040);
    expect(r.needPct).toBeCloseTo((10 / (7 * 0.998) - 1) * 100, 9);
    expect(r.needPctNoFee).toBeCloseTo(42.8571, 3);
  });

  it("평가액이 원금 이상이어도 비용을 빼면 모자랄 수 있다", () => {
    const r = recovery(10_000_000, 10_010_000, 0.2);
    if (!r.ok) throw new Error();
    expect(r.above).toBe(false);
    expect(r.needPct).toBeGreaterThan(0);
    expect(r.needPctNoFee).toBe(0);
  });

  it("이미 넘었으면 0, 음수 상승률을 내지 않는다", () => {
    const r = recovery(10_000_000, 12_000_000, 0.2);
    if (!r.ok) throw new Error();
    expect(r.above).toBe(true);
    expect(r.needPct).toBe(0);
    expect(r.shortfall).toBe(0);
  });
});

describe("경계값", () => {
  it("평가액 0 — 돌아오지 않음", () => {
    const r = recovery(10_000_000, 0);
    if (!r.ok) throw new Error();
    expect(r.wiped).toBe(true);
    expect(r.needPct).toBe(Infinity);
    expect(recoveryMonths(r.needPct, 7)).toBeNull();
  });

  it("잘못된 입력", () => {
    expect(recovery(0, 1).ok).toBe(false);
    expect(recovery(1, -1).ok).toBe(false);
    expect(recovery(1, 1, 100).ok).toBe(false);
  });
});

describe("회복 기간 = ceil(12 × ln(1+g) ÷ ln(1+r))", () => {
  it("30% 손실(+42.86%) — 연 3·5·7·10%", () => {
    const g = needFromLoss(30);
    expect(recoveryMonths(g, 3)).toBe(145);
    expect(recoveryMonths(g, 5)).toBe(88);
    expect(recoveryMonths(g, 7)).toBe(64);
    expect(recoveryMonths(g, 10)).toBe(45);
    expect(formatMonths(145)).toBe("12년 1개월");
    expect(formatMonths(45)).toBe("3년 9개월");
  });

  it("딱 맞아떨어지면 그 달(한 달 더 가지 않음) — 연 10%로 +10%는 12개월", () => {
    expect(recoveryMonths(10, 10)).toBe(12);
    expect(formatMonths(12)).toBe("1년");
  });

  it("100년 넘으면 Infinity, 0% 이하 수익률이면 null", () => {
    expect(recoveryMonths(9900, 3)).toBe(Infinity);
    expect(recoveryMonths(9900, 5)).toBe(1133);
    expect(recoveryMonths(9900, 5)!).toBeLessThanOrEqual(MAX_MONTHS);
    expect(recoveryMonths(10, 0)).toBeNull();
    expect(recoveryMonths(0, 5)).toBe(0);
    expect(formatMonths(Infinity)).toBe("100년 넘게");
    expect(formatMonths(5)).toBe("5개월");
  });
});

describe("날짜별 종가", () => {
  const text = "날짜,종가\n2026-09-01, 50,000\n2026-09-02 47000\n2026.9.3\t44,000\n9/4 42500\n2026-09-07,44800\n2026-09-08,46200\n2026-09-09,45500\n";

  it("줄 읽기 — 머리줄 건너뜀, 쉼표 자릿수, 여러 날짜 꼴", () => {
    const c = parseCloses(text);
    expect(c.map((x) => x.price)).toEqual([50000, 47000, 44000, 42500, 44800, 46200, 45500]);
    expect(c[0].date).toBe("2026-09-01");
    expect(c[2].date).toBe("2026.9.3");
    expect(c[3].date).toBe("9/4");
    expect(parseCloses("100\n110")).toEqual([{ date: null, price: 100 }, { date: null, price: 110 }]);
  });

  it("최대 낙폭·최고 종가까지·하루 평균 등락", () => {
    const s = series(10_000_000, parseCloses(text));
    if (!s.ok) throw new Error();
    expect(s.rec.current).toBeCloseTo(9_100_000, 6);
    expect(s.rec.needPct).toBeCloseTo((50000 / 45500 - 1) * 100, 9);
    expect(s.mddPct).toBeCloseTo(-15, 9);
    expect([s.peakIdx, s.troughIdx]).toEqual([0, 3]);
    expect(s.toHighPct).toBeCloseTo((50000 / 45500 - 1) * 100, 9);
    expect(s.dayPct).toBeCloseTo((45500 / 46200 - 1) * 100, 9);
    expect(s.avgCompoundPct).toBeCloseTo((Math.pow(0.91, 1 / 6) - 1) * 100, 9);
    expect(s.avgSimplePct).toBeCloseTo(-1.4617, 3);
    expect(s.steps).toBe(6);
    expect(formatMonths(recoveryMonths(s.rec.needPct, 8))).toBe("1년 3개월");
  });

  it("새 고점 뒤 낙폭이 더 크면 그 고점부터 잰다", () => {
    const s = series(1000, parseCloses("100\n80\n150\n90\n120"));
    if (!s.ok) throw new Error();
    expect(s.mddPct).toBeCloseTo(-40, 9);
    expect([s.peakIdx, s.troughIdx]).toEqual([2, 3]);
    expect(s.highest).toBe(150);
    expect(s.rec.above).toBe(true);
  });

  it("두 줄 미만이면 계산하지 않는다", () => {
    expect(series(1000, parseCloses("100")).ok).toBe(false);
  });
});
