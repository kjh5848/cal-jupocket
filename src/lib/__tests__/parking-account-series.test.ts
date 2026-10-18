/**
 * 파킹통장 이자 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 제목·설명에 쓰는 숫자는 원문 숫자뿐 — 15.4%(소득세 14% + 지방소득세 그 10%), 365(일별 이자 나눗셈),
 * '10원 미만'(국고금 관리법 제47조 ① 끝수). 이자 금액은 본문에서 parkingInterest() 가 낸다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import fin from "../../rates/financial-income-2026.json";
import pk from "../../rates/parking-account-2026.json";
import { parkingAccountSeries } from "../../data/series/parking-account";

const total = `${+(fin.withholding.interest * (1 + fin.local.ratio) * 100).toFixed(2)}%`;

describe("파킹통장 이자 시리즈 제목·설명", () => {
  it("15.4%·365 는 rates 에서", () => {
    expect(total).toBe("15.4%");
    expect(pk.dayBasis).toBe(365);
  });

  for (const s of [parkingAccountSeries.hub, ...parkingAccountSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/\d+(?:\.\d+)?%/g)) expect(m[0]).toBe(total);
      const rest = head
        .replace(/\d+(?:\.\d+)?%/g, "")
        .replace(new RegExp(`${pk.dayBasis}로`, "g"), "")
        .replace(/10원 미만/g, "");
      expect(rest).not.toMatch(/\d/);
    });
  }
});
