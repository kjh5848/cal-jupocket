/**
 * 자동차세 — 조문의 계산식과 대조한다.
 *
 * 이 계산에서 가장 쉽게 틀리는 곳이 둘이다.
 *
 *  1. cc 당 세액은 **누진이 아니다.** 1,600cc 를 1cc 넘으면 전체에 200원이
 *     붙는다. 소득세처럼 초과분만 높은 단가를 매기면 금액이 크게 틀린다.
 *  2. 차령 감면은 **12년에서 멈춘다.** 조문이 n 을 12 이하로 묶었다.
 *     "오래 탈수록 계속 깎인다" 로 두면 20년 된 차가 0원이 된다.
 */
import { describe, it, expect } from "vitest";
import {
  perCc,
  yearlyBase,
  ageDiscountRate,
  bill,
  AGE,
  EDU_RATE,
  LUMP_SUM_UNDER,
  PERIODS,
  carAge,
  TAX_YEAR,
} from "../vehicle-tax";
import r from "../../rates/local-tax-2026.json";

describe("cc 당 세액 — 제127조 제1항 제1호", () => {
  it("비영업용은 80 · 140 · 200원", () => {
    expect(perCc(999)).toBe(80);
    expect(perCc(1000)).toBe(80);
    expect(perCc(1001)).toBe(140);
    expect(perCc(1600)).toBe(140);
    expect(perCc(1601)).toBe(200);
    expect(perCc(3000)).toBe(200);
  });

  it("영업용은 훨씬 낮다", () => {
    expect(perCc(1600, "business")).toBe(18);
    expect(perCc(3000, "business")).toBe(24);
  });
});

describe("연세액 — 누진이 아니다", () => {
  it("1,600cc 는 224,000원", () => {
    expect(yearlyBase(1600)).toBe(1600 * 140);
  });

  it("1,601cc 는 320,200원 — 1cc 차이로 9만원이 뛴다", () => {
    // 여기가 이 세금에서 가장 놀라운 자리다. 초과분에만 200원이
    // 붙는다고 계산하면 224,200원이 나오는데 틀린 값이다.
    expect(yearlyBase(1601)).toBe(1601 * 200);
    expect(yearlyBase(1601) - yearlyBase(1600)).toBe(96_200);
  });

  it("2,000cc 는 400,000원", () => {
    expect(yearlyBase(2000)).toBe(400_000);
  });
});

describe("차령 감면 — 제127조 제1항 제2호", () => {
  it("2년까지는 깎이지 않는다", () => {
    expect(ageDiscountRate(0)).toBe(0);
    expect(ageDiscountRate(2)).toBe(0);
  });

  it("3년차부터 해마다 5%씩", () => {
    expect(ageDiscountRate(3)).toBeCloseTo(0.05, 10);
    expect(ageDiscountRate(5)).toBeCloseTo(0.15, 10);
    expect(ageDiscountRate(10)).toBeCloseTo(0.4, 10);
  });

  it("12년에서 멈춘다 — 20년 된 차도 50%", () => {
    expect(ageDiscountRate(12)).toBeCloseTo(0.5, 10);
    expect(ageDiscountRate(20)).toBeCloseTo(0.5, 10);
    expect(ageDiscountRate(30)).toBeCloseTo(0.5, 10);
  });

  it("조문이 정한 상한이 12년이다", () => {
    expect(AGE.maxYear).toBe(12);
    expect(AGE.startYear).toBe(3);
  });

  it("영업용에는 차령 감면이 없다", () => {
    const 비영업 = bill({ cc: 2000, ageYears: 10 });
    const 영업 = bill({ cc: 2000, ageYears: 10, use: "business" });
    expect(비영업.discountRate).toBeCloseTo(0.4, 10);
    expect(영업.discountRate).toBe(0);
  });
});

describe("고지서", () => {
  it("지방교육세가 30% 붙는다 — 재산세(20%)와 다르다", () => {
    expect(EDU_RATE).toBe(0.3);
    const b = bill({ cc: 2000 });
    expect(b.vehicleTax).toBe(400_000);
    expect(b.educationTax).toBe(120_000);
    expect(b.total).toBe(520_000);
  });

  it("10년 된 2,000cc 는 감면으로 24만원이 된다", () => {
    const b = bill({ cc: 2000, ageYears: 10 });
    expect(b.vehicleTax).toBe(240_000);
    expect(b.total).toBe(240_000 + 72_000);
  });

  it("연세액 10만원 이하면 6월에 한 번에 올 수 있다", () => {
    expect(LUMP_SUM_UNDER).toBe(100_000);
    expect(bill({ cc: 1000 }).lumpSum).toBe(true); // 80,000원
    expect(bill({ cc: 2000 }).lumpSum).toBe(false);
  });

  it("그 밖에는 절반씩 두 번", () => {
    const b = bill({ cc: 2000 });
    expect(b.perHalf).toBe(260_000);
  });
});

describe("납기와 근거", () => {
  it("6월과 12월이다", () => {
    expect(PERIODS.map((p) => p.from)).toEqual(["6월 16일", "12월 16일"]);
    expect(PERIODS.map((p) => p.to)).toEqual(["6월 30일", "12월 31일"]);
  });

  it("세액표가 조문 표에서 왔음을 밝힌다", () => {
    expect(r.vehicleTax.ratesArticle).toContain("제127조");
    expect(r.vehicleTax.ratesArticle).toContain("(표)");
    expect(r.vehicleTax.periodsArticle).toContain("(표)");
  });

  it("연납 공제율은 아직 모른다고 적어 뒀다", () => {
    // 조문이 "100분의 10의 범위에서" 라고만 하고 시행령에 넘긴다.
    // 흔히 쓰이는 숫자가 있지만 원문에서 못 봤으면 쓰지 않는다.
    expect(r.vehicleTax.notVerified.join(" ")).toMatch(/연납/);
  });
});

describe("기분별 차령 — 지방세법 시행령 제122조 제2항", () => {
  it("상반기 기산은 두 기분 같고, 과세연도 − 기산 연도 + 1", () => {
    expect(carAge(2026, "first", 2026)).toEqual({ first: 1, second: 1 });
    expect(carAge(2024, "first", 2026)).toEqual({ first: 3, second: 3 });
  });

  it("하반기 기산은 제1기분이 한 해 적다", () => {
    expect(carAge(2023, "second", 2026)).toEqual({ first: 3, second: 4 });
    expect(carAge(2026, "second", 2026)).toEqual({ first: 0, second: 1 });
  });

  it("과세연도보다 뒤는 0, 기본 과세연도는 rates 연도", () => {
    expect(carAge(2030, "first", 2026)).toEqual({ first: 0, second: 0 });
    expect(TAX_YEAR).toBe(r.vehicleTax.ageDiscount.ageCount.taxYear);
    expect(carAge(2024, "first")).toEqual(carAge(2024, "first", TAX_YEAR));
  });

  it("하반기 기산 2,000cc 2023 — 6월분 5%·12월분 10% 감면, 본세 370,000원", () => {
    const b = bill({ cc: 2000, ages: carAge(2023, "second", 2026) });
    expect(b.halfRates[0]).toBeCloseTo(0.05, 10);
    expect(b.halfRates[1]).toBeCloseTo(0.1, 10);
    expect(b.vehicleTax).toBe(190_000 + 180_000);
    expect(b.halves[0] + b.halves[1]).toBe(b.total);
    expect(b.halves).toEqual([247_000, 234_000]);
  });

  // 2026-10-18 roberin #65 같은 입력(비영업용 2,000cc) — 연세액(교육세 포함)이 1원까지 같다.
  it.each([
    [2026, "first", 520_000],
    [2024, "first", 494_000],
    [2023, "second", 481_000],
    [2014, "first", 260_000],
  ] as const)("roberin 대조 %i %s → %i원", (y, h, total) => {
    expect(bill({ cc: 2000, ages: carAge(y, h, 2026) }).total).toBe(total);
  });

  it("ages 를 같게 주면 ageYears 와 같은 결과", () => {
    for (const cc of [999, 1598, 1601, 2000, 3342])
      for (let n = 0; n <= 14; n++)
        expect(bill({ cc, ages: { first: n, second: n } })).toEqual(bill({ cc, ageYears: n }));
  });
});

describe("차령 감면 버림 — 부동소수점 1원 모자람(2026-10-18 fix)", () => {
  it("2,000cc 차령 9년은 260,000원 (1 − 0.35 = 0.6499… 로 259,999원이 나오던 자리)", () => {
    expect(bill({ cc: 2000, ageYears: 9 }).vehicleTax).toBe(260_000);
  });

  it("배기량 1~6,000cc × 차령 0~12년 전부 정수 계산과 같다", () => {
    let bad = 0;
    for (let cc = 1; cc <= 6000; cc++)
      for (let n = 0; n <= 12; n++) {
        const A = BigInt(yearlyBase(cc));
        const p = BigInt(Math.round(ageDiscountRate(n) * 100));
        if (BigInt(bill({ cc, ageYears: n }).vehicleTax) !== (A * (100n - p)) / 100n) bad++;
      }
    expect(bad).toBe(0);
  });
});
