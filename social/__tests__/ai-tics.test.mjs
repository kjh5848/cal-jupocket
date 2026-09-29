/**
 * AI 가 쓴 티를 기계가 잡는다 — 산문 규칙은 건너뛸 수 있어서.
 *
 * `SKILL.md` 에 금지 목록을 적어 뒀는데도 066~069 가 그대로 나갔다.
 * 사람이 읽는 규칙은 읽지 않으면 없는 것과 같다. 그래서 `npm test` 가
 * 돌게 옮긴다.
 *
 * **미발행 글만 본다.** 이미 나간 글은 고칠 수 없고, 매번 같은 경고를
 * 띄우면 아무도 안 본다.
 *
 * 이 테스트가 통과했다고 글이 좋다는 뜻이 아니다. 정규식이 "사람이 없는
 * 스토리" 를 알아볼 수는 없다. **명백히 나쁜 것이 없다**는 뜻일 뿐이고,
 * 나머지는 사람이 읽어야 한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePost } from "../parse.mjs";
import {
  scanPost,
  scanRhythm,
  rhythm,
  bodyLines,
  formatReport,
  RULES,
  RHYTHM_WINDOW,
  RHYTHM_MIN_DISTINCT,
} from "../ai-tics.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const QUEUE = join(HERE, "../queue");
const LEDGER = join(HERE, "../posted.json");

const posted = new Set(
  existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")).map((e) => e.file) : [],
);
const unposted = readdirSync(QUEUE)
  .filter((f) => f.endsWith(".md") && !posted.has(f))
  .sort()
  .map((f) => {
    const { meta, text } = parsePost(readFileSync(join(QUEUE, f), "utf8"));
    return { file: f, meta, text };
  });

describe("탐지기 자체", () => {
  it('"A가 아니라 B다" 를 잡는다', () => {
    const hit = scanPost("떼인 3.3%가 기준이 아니라\n5월에 낸 돈이 기준이다.");
    expect(hit.map((r) => r.key)).toContain("대구");
  });

  it("사실을 말하는 부정문은 잡지 않는다", () => {
    // "고지서가 안 왔다" 는 사실이지 대구가 아니다. 부정문 전부를 막으면
    // 쓸 수 있는 문장이 남지 않는다.
    const hit = scanPost("10월인데 부가세 고지서가 안 왔다.\n빠뜨린 줄 알았다.");
    expect(hit.map((r) => r.key)).not.toContain("대구");
  });

  it("마지막 줄 훈수를 잡는다", () => {
    const hit = scanPost("작년 매출이 4,810만원이었다.\n\n경계가 거기 있다는 말이다.");
    expect(hit.map((r) => r.key)).toContain("훈수");
  });

  it("본문 조문을 잡는다", () => {
    const hit = scanPost("고지서가 왔다.\n소득세법 제65조 제7항 기준입니다.");
    expect(hit.map((r) => r.key)).toContain("조문");
  });

  it("tics_ok 로 글 단위로 열 수 있다", () => {
    const text = "떼인 3.3%가 기준이 아니라\n5월에 낸 돈이 기준이다.";
    expect(scanPost(text, { tics_ok: "대구" }).map((r) => r.key)).not.toContain("대구");
  });

  it("※ 줄과 마무리는 검사에서 뺀다", () => {
    // 마무리 한 줄은 코드가 붙이는 것이라 글쓴이 책임이 아니다.
    expect(bodyLines("본문이다.\n\n※ 가상 사례입니다.")).toEqual(["본문이다."]);
  });

  it("리듬 지문은 문단별 줄 수다", () => {
    expect(rhythm("가\n\n나\n다\n\n라\n마")).toBe("1-2-2");
  });

  it("규칙마다 고치는 법이 적혀 있다", () => {
    // "규칙 위반" 만 뜨면 무엇을 고쳐야 하는지 모른다.
    for (const r of RULES) {
      expect(r.why.length, r.key).toBeGreaterThan(10);
      expect(r.label.length, r.key).toBeGreaterThan(2);
    }
  });
});

describe("미발행 큐 글", () => {
  it("구문 걸림이 없다", () => {
    const rows = unposted.map((p) => ({ file: p.file, findings: scanPost(p.text, p.meta) }));
    const bad = rows.filter((r) => r.findings.length > 0);
    expect(bad.length === 0 || formatReport(rows)).toBe(true);
  });

  it(`리듬이 겹치지 않는다 — ${RHYTHM_WINDOW}편 안에 지문 ${RHYTHM_MIN_DISTINCT}개 이상`, () => {
    const bad = scanRhythm(unposted);
    const msg = bad
      .map((b) => `${b.from} ~ ${b.to}: 지문 ${b.distinct}개 (${b.sigs.join(", ")})`)
      .join(" / ");
    expect(bad.length === 0 || msg).toBe(true);
  });
});
