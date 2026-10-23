/**
 * 미국 연방 CTC·ODC·ACTC — 26 U.S.C. 24 · Rev. Proc. 2024-40·2025-32 §3.05 · Schedule 8812 (2025) 줄 순서 (2026-10-23 확인).
 * 공식 숫자 예시가 없어(Pub 972 폐지) rates 의 anchorTests(서식 줄 손계산 6개)로 고정한다.
 */
import { describe, it, expect } from "vitest";
import rates from "../../rates/us/child-tax-credit-2026.json";
import { ANCHORS, amounts, computeCtc, phaseoutEnd, type CtcInput } from "../us/child-tax-credit";

const base: CtcInput = { year: 2026, status: "other", children: 1, otherDependents: 0, magi: 30_000, taxLimit: 0, earned: 30_000 };

describe("rates", () => {
  it("draft 가 아니고 미확인이 없다", () => {
    expect((rates as Record<string, unknown>).draft).toBeUndefined();
    expect(rates.notVerified).toEqual([]);
  });
  it("2025·2026 금액(Rev. Proc. 2024-40·2025-32 §3.05)", () => {
    expect(amounts(2025)).toMatchObject({ ctcPerChild: 2200, actcCapPerChild: 1700 });
    expect(amounts(2026)).toMatchObject({ ctcPerChild: 2200, actcCapPerChild: 1700 });
  });
});

describe("anchorTests — Schedule 8812 (2025) 줄 손계산", () => {
  const inputs: CtcInput[] = [
    { year: 2026, status: "mfj", children: 2, otherDependents: 0, magi: 410_500, taxLimit: 100_000, earned: 410_500 },
    { year: 2026, status: "other", children: 1, otherDependents: 0, magi: 30_000, taxLimit: 600, earned: 30_000 },
    { year: 2026, status: "other", children: 1, otherDependents: 0, magi: 10_000, taxLimit: 0, earned: 10_000 },
    { year: 2026, status: "other", children: 3, otherDependents: 0, magi: 20_000, taxLimit: 0, earned: 20_000, socialSecurityTaxes: 1530, eic: 8231 },
    { year: 2026, status: "mfj", children: 1, otherDependents: 0, magi: 400_425, taxLimit: 100_000, earned: 400_425 },
    { year: 2026, status: "other", children: 0, otherDependents: 1, magi: 30_000, taxLimit: 0, earned: 30_000 },
  ];
  it("앵커가 6개", () => expect(ANCHORS).toHaveLength(inputs.length));
  it.each(ANCHORS.map((a, n) => [a.case, a, inputs[n]] as const))("%s", (_, a, input) => {
    const r = computeCtc(input) as unknown as Record<string, number | null>;
    const map: Record<string, string> = { actc: "line27", total: "total" };
    for (const [key, v] of Object.entries(a)) {
      if (key === "case" || key === "note") continue;
      expect(r[map[key] ?? key], key).toBe(v);
    }
  });
});

describe("줄 규칙", () => {
  it("line 10: $1,000 배수로 올림, 정확히 배수면 그대로", () => {
    expect(computeCtc({ ...base, magi: 211_000 }).line10).toBe(11_000);
    expect(computeCtc({ ...base, magi: 211_000.01 }).line10).toBe(12_000);
    expect(computeCtc({ ...base, magi: 200_000 }).line10).toBe(0);
  });
  it("line 12 가 0 이면 전부 0", () => {
    const r = computeCtc({ ...base, magi: 250_000, taxLimit: 10_000 });
    expect(r.line12).toBe(0);
    expect(r.total).toBe(0);
    expect(r.actcReason).toBe("noCredit");
  });
  it("세액이 충분하면 ACTC 없음", () => {
    const r = computeCtc({ ...base, taxLimit: 5000 });
    expect(r.line14).toBe(2200);
    expect(r.line27).toBe(0);
    expect(r.actcReason).toBe("fullyUsed");
  });
  it("ODC 만이면 세액이 있어도 환급 없음", () => {
    const r = computeCtc({ ...base, children: 0, otherDependents: 2, taxLimit: 300 });
    expect(r.line14).toBe(300);
    expect(r.line27).toBe(0);
    expect(r.actcReason).toBe("noChildren");
  });
  it("ACTC 상한은 자녀 수 × $1,700 (ODC 제외)", () => {
    const r = computeCtc({ ...base, children: 2, otherDependents: 1, earned: 60_000, magi: 60_000 });
    expect(r.line12).toBe(4900);
    expect(r.line16b).toBe(3400);
    expect(r.line27).toBe(3400);
  });
  it("earned income $2,500 이하면 ACTC 0 (자녀 1·2명)", () => {
    const r = computeCtc({ ...base, earned: 2500, magi: 2500 });
    expect(r.line20).toBe(0);
    expect(r.line27).toBe(0);
    expect(r.actcReason).toBe("noEarned");
  });
  it("Part II-B: 자녀 3명 이상, 사회보장세 − EIC 가 line 20 보다 크면 그쪽", () => {
    const r = computeCtc({ ...base, children: 3, earned: 3000, magi: 3000, socialSecurityTaxes: 229.5, eic: 0 });
    expect(r.line20).toBe(75);
    expect(r.line25).toBe(229.5);
    expect(r.line27).toBe(229.5);
  });
  it("자녀 2명이면 Part II-B 를 보지 않는다", () => {
    const r = computeCtc({ ...base, children: 2, earned: 3000, magi: 3000, socialSecurityTaxes: 229.5 });
    expect(r.line25).toBeNull();
    expect(r.line27).toBe(75);
  });
  it("감소 끝: single 자녀 1명은 MAGI $243,000 까지 남고 넘으면 0", () => {
    expect(phaseoutEnd("other", 2200)).toBe(243_000);
    expect(computeCtc({ ...base, magi: 243_000, taxLimit: 10_000 }).line12).toBe(50);
    expect(computeCtc({ ...base, magi: 243_000.5, taxLimit: 10_000 }).line12).toBe(0);
    expect(phaseoutEnd("mfj", 4400)).toBe(487_000);
  });
});
