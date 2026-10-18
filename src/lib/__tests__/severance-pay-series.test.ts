/**
 * 퇴직금 계산 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 기간·비율이 rates 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/severance-2026.json";
import { severancePaySeries } from "../../data/series/severance-pay";

const counts = new Set([
  `${r.pay.daysPerYear}일`, // 제8조 30일분
  `${r.deadline.days}일`, // 제9조 14일
  "1년", // 제4조 제1항 1년 미만 제외
  "3개월", // 근로기준법 제2조 제1항 제6호
  "1일", // 1일 평균임금(근로기준법 제2조 — 용어)
  "5명", // 제3조 — 규모 예외 없음(제목의 '5명 미만')
]);

describe("퇴직금 계산 시리즈 제목·설명", () => {
  it("rates 문장에 기준이 실제로 있다", () => {
    expect(r.pay.excluded).toContain("1년 미만");
    expect(r.pay.excluded).toContain("15시간");
    expect(r.pay.averageWage).toContain("3개월");
    expect(r.pay.scope).toContain("모든 사업");
    expect(r.pay.byDays.bonusShare).toBe(3 / 12);
    expect(r.pay.byDays.daysInYear).toBe(365);
  });

  for (const s of [severancePaySeries.hub, ...severancePaySeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      expect(head).not.toMatch(/\d+%/);
      expect(head).not.toMatch(/[\d,]+원/);
      for (const m of head.matchAll(/(?<![\d,.])\d+(?:개월|일|년|명)(?!\d)/g)) expect(counts, m[0]).toContain(m[0]);
      if (/4분의 1/.test(head)) expect(r.pay.byDays.bonusShare).toBe(0.25);
      if (/365/.test(head)) expect(r.pay.byDays.daysInYear).toBe(365);
      if (/15시간/.test(head)) expect(r.pay.excluded).toContain("15시간");
    });
  }
});
