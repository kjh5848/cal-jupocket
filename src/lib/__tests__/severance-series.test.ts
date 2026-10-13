/**
 * 퇴직금·퇴직연금 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액·기간이 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/severance-2026.json";
import { severanceSeries } from "../../data/series/severance";
import { severanceTax } from "../severance";
import { eokwon, won } from "../won";

const pct = (v: number) => `${Math.round(v * 100)}%`;
const P = r.pensionReceipt;
const N = r.pensionIncome;
const percents = new Set([
  pct(P.upTo10), pct(P.upTo20), pct(P.over20), `${Math.round((1 - P.upTo10) * 100)}~${pct(1 - P.over20)}`,
  ...N.byAge.map((b) => pct(b.rate)), pct(N.optionRate), pct(N.nonAnnuity), pct(r.deadline.lateInterest),
]);
const money = new Set([eokwon(100_000_000), won(severanceTax(100_000_000, 10).total), eokwon(N.separateLimit)]);
const counts = new Set([
  `${r.deadline.days}일`, `${r.pay.limitationYears}년`, "10년", "1년", // 10년 = 예시 근속, 1년 = 근속연수 끝수(제48조)
  "10년차", "20년차", // 제129조 제1항 제5호의3 구간
  "55세", "5년", "6개월", "70세", "80세", // 시행령 제18조·제3조·제14조, 제129조 제1항 제5호의2 표
  "12분의 1",
]);

describe("퇴직 시리즈 제목·설명", () => {
  it("rates 문장에 기간 기준이 실제로 있다", () => {
    expect(r.irpTransfer.payout).toContain("55세");
    expect(r.irpTransfer.payout).toContain("5년");
    expect(r.interim.reasons.join(" ")).toContain("6개월");
    expect(r.interim.reasons.join(" ")).toContain("5년");
    expect(r.dc.contribution).toContain("12분의 1");
    expect(N.byAge.map((b) => b.label).join(" ")).toMatch(/70세.*80세/);
  });

  for (const s of [severanceSeries.hub, ...severanceSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/\d+(?:~\d+)?%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d,]+억원|[\d,]+만원|[\d,]+원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,.])\d+(?:년차|개월|일|년|세|분의 1)(?!\d)/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
