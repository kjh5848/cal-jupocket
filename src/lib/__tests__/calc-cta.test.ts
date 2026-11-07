import { describe, it, expect } from "vitest";
import { calcCta, calcNext, ctaFor, nextFor } from "../../data/calc-cta";
import { clusters } from "../../data/clusters";

const calcs = new Set(clusters.flatMap((c) => c.links.filter((l) => l.kind === "calc").map((l) => (l.href.endsWith("/") ? l.href : `${l.href}/`))));

describe("글 → 계산기 버튼 등록부", () => {
  it("등록된 주소는 전부 실제 계산기다", () => {
    for (const href of Object.keys(calcCta)) expect(calcs.has(href), href).toBe(true);
  });

  it("문구 길이 — 질문 40자, 설명 60자 이내, 숫자 없음", () => {
    for (const [href, c] of Object.entries(calcCta)) {
      expect(c.q.length, href).toBeLessThanOrEqual(40);
      expect(c.sub.length, href).toBeLessThanOrEqual(60);
      expect(/\d/.test(c.q + c.sub), `${href} 문구에 숫자`).toBe(false);
    }
  });

  it("계산기 페이지에는 버튼을 붙이지 않는다", () => {
    for (const href of calcs) expect(ctaFor(href), href).toBeNull();
  });

  it("글은 같은 묶음의 가장 가까운 계산기로 간다", () => {
    expect(ctaFor("/guide/loan-interest/")?.href).toBe("/guide/loan-calculator/");
    expect(ctaFor("/guide/dsr-limit/")?.href).toBe("/guide/dsr-calculator/");
    expect(ctaFor("/guide/prepayment-fee-3-years")?.href).toBe("/guide/prepayment-fee-calculator/");
  });

  it("계산기 → 다음 단계: 출발·도착 모두 실제 계산기, 자기 자신으로 가지 않음, 문구 규칙 같음", () => {
    for (const [from, n] of Object.entries(calcNext)) {
      expect(calcs.has(from), from).toBe(true);
      expect(calcs.has(n.href), n.href).toBe(true);
      expect(n.href).not.toBe(from);
      expect(n.q.length, from).toBeLessThanOrEqual(40);
      expect(n.sub.length, from).toBeLessThanOrEqual(60);
      expect(/\d/.test(n.q + n.sub), `${from} 문구에 숫자`).toBe(false);
      expect(nextFor(from)?.href).toBe(n.href);
    }
  });

  it("묶음에 없는 주소는 버튼이 없다", () => {
    expect(ctaFor("/no-such-page/")).toBeNull();
  });
});
