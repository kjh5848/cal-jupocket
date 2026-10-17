/** 종부세 과세표준·세율·농특세의 Math.floor 가 부동소수점 꼬리로 1원 모자라지 않는지(취득세 회차 byRate 사고 재발 방지). 2026-10-18 1만원 단위 300만 개도 0건. */
import { it, expect } from "vitest";
import { estimate } from "../comprehensive-property-tax";
import r from "../../rates/comprehensive-property-2026.json";
const intTax = (base: number, k: "upTo2Homes" | "from3Homes") => {
  let prev = 0;
  for (const b of r.rates[k].brackets) {
    const ppm = Math.round(b.rate * 1e6);
    if (b.upTo === null || base <= b.upTo) return b.base + Math.floor(((base - prev) * ppm) / 1e6);
    prev = b.upTo;
  }
  return 0;
};
it("원 미만 버림이 정수 연산과 같다 — 10만원 단위 0~100억, 1주택·2주택 이하·3주택 이상", () => {
  const bad: string[] = [];

  for (const one of [true, false]) for (const k of ["upTo2Homes", "from3Homes"] as const) {
    if (one && k === "from3Homes") continue;
    for (let p = 0; p <= 10_000_000_000; p += 100_000) {

      const e = estimate({ totalPrice: p, oneHome: one, homes: k });
      const after = p - (one ? 1_200_000_000 : 900_000_000);
      const base = after <= 0 ? 0 : Math.floor((after * 6) / 10);
      const tax = base <= 0 ? 0 : intTax(base, k);
      const rural = Math.floor((tax * 2) / 10);
      if (e.base !== base || e.tax !== tax || e.rural !== rural) bad.push(`${one}/${k}/${p}: ${e.base},${e.tax},${e.rural} vs ${base},${tax},${rural}`);
    }
  }
  expect(bad.slice(0, 5)).toEqual([]);

}, 600_000);
