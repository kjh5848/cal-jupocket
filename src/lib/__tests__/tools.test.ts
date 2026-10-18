/** 리브랜딩 Task 3 — 도구 레지스트리가 링크허브 번호·클러스터와 어긋나지 않는지. */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { tools, liveTools, nextTools, toolCount } from "../../data/tools";
import { TOOL_TYPES } from "../../data/tool-types";
import { entryByNo } from "../../data/linkhub";
import { clusters } from "../../data/clusters";
import { BACKLOG_TOTAL } from "../../data/tool-backlog-count";

describe("도구 레지스트리", () => {
  it("공개 도구의 번호는 링크허브 번호와 같은 주소", () => {
    for (const t of liveTools) expect(entryByNo(t.no!)?.href, t.href).toBe(t.href);
  });
  it("번호·주소 중복 없음", () => {
    const nos = liveTools.map((t) => t.no);
    expect(new Set(nos).size).toBe(nos.length);
    expect(new Set(tools.map((t) => t.href)).size).toBe(tools.length);
  });
  it("곧 담길 도구는 번호 없음, 4~8개", () => {
    for (const t of nextTools) expect(t.no).toBeNull();
    expect(nextTools.length).toBeGreaterThanOrEqual(4);
    expect(nextTools.length).toBeLessThanOrEqual(8);
  });
  it("분류는 12개 안", () => {
    const keys = new Set(TOOL_TYPES.map((t) => t.key));
    for (const t of tools) expect(keys.has(t.type), t.href).toBe(true);
  });
  it("클러스터의 계산기와 계산기 카드가 있는 글이 전부 들어 있다", () => {
    const hrefs = new Set(liveTools.map((t) => t.href));
    for (const c of clusters) for (const l of c.links) if (l.kind === "calc") expect(hrefs.has(l.href), l.href).toBe(true);
    expect(liveTools.length).toBe(51);
  });
  it("범용(/tools/) 도구에는 법 원문 검증 표시가 없다", () => {
    const p = liveTools.find((t) => t.href === "/tools/percent/")!;
    expect(p.verified).toBeUndefined();
    expect(p.type).toBe("unit");
    expect(liveTools.find((t) => t.href === "/vat/")!.verified).toBe("law");
  });
  it("검색어에 이름 자체가 들어 있다", () => {
    for (const t of tools) expect(t.keywords).toContain(t.name);
  });
  it("전체 수 = backlog 표(제외·중복 뺀 행)", () => {
    const rows = readFileSync("docs/tool-backlog.md", "utf-8").split("\n").filter((l) => /^\| \d+ \|/.test(l));
    const count = rows.filter((l) => !/\| 제외 \|/.test(l) && !/중복:/.test(l)).length;
    expect(BACKLOG_TOTAL).toBe(count);
    expect(toolCount()).toEqual({ live: liveTools.length, total: BACKLOG_TOTAL });
  });
});
