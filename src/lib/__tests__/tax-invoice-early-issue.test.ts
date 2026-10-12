import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import r from "../../rates/vat-2026.json";

const E = r.taxInvoice.earlyIssue;
const DIST = join(process.cwd(), "dist/guide/tax-invoice-early-issue/index.html");
const built = existsSync(DIST);
const PAGE = built ? readFileSync(DIST, "utf-8").replace(/<[^>]+>/g, " ") : "";

/**
 * 세금계산서 발행 후 대금 지급 기한(48번) — 부가가치세법 제17조.
 *
 * 이 글이 틀리기 쉬운 자리는 둘이다. "30일" 만 떼어 내 조건 없이 쓰는 것,
 * 그리고 조건을 못 맞췄을 때 가산세율을 지어내는 것.
 */
describe("선발행 세금계산서", () => {
  it("먼저 끊었으면 7일 안에 대가를 받아야 한다", () => {
    expect(E.sevenDays.days).toBe(7);
    expect(E.sevenDays.article).toBe("제17조 제2항");
  });

  it("30일 예외는 계약서에 청구·지급시기를 따로 적은 경우에만이다", () => {
    const c = E.beyondSeven.cases.find((x) => x.key === "contract30")!;
    expect(c.days).toBe(30);
    expect(c.label).toContain("계약서");
    expect(c.label).toContain("따로 적고");
  });

  it("예외는 두 가지다", () => {
    expect(E.beyondSeven.cases).toHaveLength(2);
  });

  it("세법이 대금 지급 기한을 정한다고 쓰지 않는다", () => {
    expect(E.noPaymentDeadline).toContain("정하지 않는다");
  });

  it.skipIf(!built)("30일을 말할 때 계약서 조건을 같이 말한다", () => {
    expect(PAGE).toContain("30일");
    expect(PAGE).toMatch(/계약서[^.]{0,40}(청구시기|따로)/);
  });

  it.skipIf(!built)("조건을 못 맞췄을 때 가산세율을 지어내지 않는다", () => {
    expect(E.ifMissed).toContain("찾지 못했다");
    expect(PAGE).not.toMatch(/선발행[^.]{0,60}\d+(\.\d+)?\s*(%|퍼센트)/);
  });

  it.skipIf(!built)("44번이 선발행의 조건을 빠뜨리지 않는다", () => {
    const p44 = readFileSync(join(process.cwd(), "dist/guide/tax-invoice-date/index.html"), "utf-8");
    expect(p44).toContain("7일");
    expect(p44).toContain("/guide/tax-invoice-early-issue/");
  });
});
