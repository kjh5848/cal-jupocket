/**
 * 급여명세서 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·개수·기간이 payslip-2026.json 과 같은지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/payslip-2026.json";
import { payslipSeries } from "../../data/series/payslip";
import { eokwon } from "../won";

const F = r.fines;
const money = new Set([eokwon(F.payslipNotIssued[0]), eokwon(F.ledgerNotMade[0]), eokwon(F.max)]);
const counts = new Set([`${r.payslip.items.length}가지`, `${r.ledger.items.length}가지`, `${r.ledger.keepYears}년`, "5명", "4명"]);

describe("급여명세서 rates", () => {
  it("기재사항 6가지·10가지, 보존 3년", () => {
    expect(r.payslip.items).toHaveLength(6);
    expect(r.ledger.items).toHaveLength(10);
    expect(r.ledger.keepYears).toBe(3);
  });
  it("과태료는 법정 상한 500만원 안", () => {
    for (const k of ["payslipNotIssued", "payslipWrong", "ledgerNotMade", "ledgerPartial", "keepViolation"] as const)
      for (const v of F[k]) expect(v).toBeLessThanOrEqual(F.max);
  });
});

describe("급여명세서 시리즈 제목·설명", () => {
  for (const s of [payslipSeries.hub, ...payslipSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      expect(head).not.toMatch(/\d+(?:\.\d+)?%/);
      for (const m of head.matchAll(/[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,])\d+(?:가지|년|명)/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
