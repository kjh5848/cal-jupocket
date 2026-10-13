import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * 금액 뒤 조사 — "900만원가", "299,850원로" 같은 것.
 *
 * 금액을 계산 함수로 끼워 넣으면 조사를 사람이 고르지 못한다. "원" 은 받침으로
 * 끝나므로 이/을/은/과/으로 가 맞다. 2026-10-12·13 에 두 번 실제로 나갔다.
 * 빌드된 글 전부를 본다.
 */
const DIR = join(process.cwd(), "dist/guide");
const built = existsSync(DIR);

describe.skipIf(!built)("금액 뒤 조사", () => {
  it("'원' 뒤에 가·를·는·와·로 가 붙지 않는다", () => {
    const bad: string[] = [];
    for (const d of readdirSync(DIR)) {
      const f = join(DIR, d, "index.html");
      if (!existsSync(f)) continue;
      const t = readFileSync(f, "utf-8")
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<[^>]+>/g, " ");
      for (const m of t.matchAll(/([0-9]|만|천)원(가|를|는|와|로) /g)) {
        bad.push(`${d}: …${t.slice(Math.max(0, m.index! - 20), m.index! + 6)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
