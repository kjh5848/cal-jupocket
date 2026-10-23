import { describe, it, expect } from "vitest";
import { cpiAdjust, rateAdjust, won, CPI, FIRST_YEAR, LAST_YEAR } from "../inflation";
import rates from "../../rates/cpi-2026.json";

const ok = <T extends { ok: boolean }>(r: T) => {
  if (!r.ok) throw new Error("not ok");
  return r as Extract<T, { ok: true }>;
};

describe("CPI 표 (ECOS 901Y009, 2020=100)", () => {
  it("1965~2025 61개 연도, 2020 = 100, 2025 = 116.61", () => {
    expect(FIRST_YEAR).toBe(1965);
    expect(LAST_YEAR).toBe(2025);
    expect(Object.keys(CPI)).toHaveLength(61);
    expect(CPI[2020]).toBe(100);
    expect(CPI[2025]).toBe(116.61);
    expect(CPI[2000]).toBe(63.151);
  });
  it("sources 와 verifiedOn 이 있다", () => {
    expect(rates.sources.length).toBeGreaterThan(0);
    expect(rates.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("cpiAdjust", () => {
  it("과거 → 현재: 2000년 100만원은 2025년 1,846,527원, 누적 84.7%·연평균 2.48%", () => {
    const r = ok(cpiAdjust(1_000_000, 2000, 2025));
    expect(won(r.value)).toBe(1_846_527);
    expect(r.cumulativePct.toFixed(1)).toBe("84.7");
    expect(r.annualPct.toFixed(2)).toBe("2.48");
    expect(r.span).toBe(25);
    expect(r.direction).toBe("forward");
  });
  it("경계: 1965년 5만원 → 2025년 2,233,052원", () => {
    expect(won(ok(cpiAdjust(50_000, 1965, 2025)).value)).toBe(2_233_052);
  });
  it("현재 → 과거: 2025년 100만원은 1995년 445,888원어치, 상승률은 1995 → 2025 로(+124.3%, 2.73%)", () => {
    const r = ok(cpiAdjust(1_000_000, 2025, 1995));
    expect(won(r.value)).toBe(445_888);
    expect(r.direction).toBe("backward");
    expect(r.cumulativePct.toFixed(1)).toBe("124.3");
    expect(r.annualPct.toFixed(2)).toBe("2.73");
  });
  it("2019년 3천만원 → 2024년 34,437,898원", () => {
    expect(won(ok(cpiAdjust(30_000_000, 2019, 2024)).value)).toBe(34_437_898);
  });
  it("같은 해면 그대로, 상승률 0", () => {
    const r = ok(cpiAdjust(12_345, 2010, 2010));
    expect(r.value).toBe(12_345);
    expect(r.annualPct).toBe(0);
    expect(r.direction).toBe("same");
  });
  it("금액 0·없는 연도는 막는다", () => {
    expect(cpiAdjust(0, 2000, 2025)).toEqual({ ok: false, reason: "amount" });
    expect(cpiAdjust(1000, 1964, 2025)).toEqual({ ok: false, reason: "year" });
    expect(cpiAdjust(1000, 2000, 2026)).toEqual({ ok: false, reason: "year" });
  });
  it("roberin 값은 2020년 이전 CPI 를 소수 둘째 자리로 줄이면 재현된다(차이 원인 고정)", () => {
    const r2 = (y: number) => Math.round(CPI[y] * 100 + 1e-9) / 100;
    const alt = (a: number, f: number, t: number) => Math.round((a * r2(t)) / r2(f));
    expect(alt(1_000_000, 2000, 2025)).toBe(1_846_556);
    expect(alt(50_000, 1965, 2025)).toBe(2_233_908);
    expect(alt(30_000_000, 2019, 2024)).toBe(34_436_514);
  });
});

describe("rateAdjust", () => {
  it("100만원 · 연 2.5% · 10년 뒤 가격 1,280,085원", () => {
    const r = ok(rateAdjust(1_000_000, 2.5, 10, "future"));
    expect(won(r.value)).toBe(1_280_085);
    expect(r.cumulativePct.toFixed(1)).toBe("28.0");
  });
  it("10년 뒤 1억의 오늘 가치(연 2%) 82,034,830원", () => {
    expect(won(ok(rateAdjust(100_000_000, 2, 10, "present")).value)).toBe(82_034_830);
  });
  it("0년·0%면 그대로, 잘못된 입력은 막는다", () => {
    expect(ok(rateAdjust(5000, 3, 0, "future")).value).toBe(5000);
    expect(ok(rateAdjust(5000, 0, 30, "present")).value).toBe(5000);
    expect(rateAdjust(5000, -100, 3, "future")).toEqual({ ok: false, reason: "rate" });
    expect(rateAdjust(5000, 2, -1, "future")).toEqual({ ok: false, reason: "years" });
    expect(rateAdjust(-1, 2, 1, "future")).toEqual({ ok: false, reason: "amount" });
  });
});
