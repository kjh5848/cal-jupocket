/**
 * 번호표가 깨지지 않는지 지킨다.
 *
 * 발행된 카드가 "13번 글"을 가리키고 있는데 13번이 다른 글이 되면 그 카드는
 * 거짓말이 된다. 회수할 수 없으므로 여기서 막는다.
 */
import { describe, it, expect } from "vitest";
import { hubEntries, nextNo, entryByNo, hubGroups } from "../../data/linkhub";
import { clusters } from "../../data/clusters";

const clusterHrefs = clusters.flatMap((c) => c.links.map((l) => l.href));

describe("번호표", () => {
  it("번호가 중복되지 않는다", () => {
    const nos = hubEntries.map((e) => e.no);
    expect(new Set(nos).size).toBe(nos.length);
  });

  it("주소가 중복되지 않는다", () => {
    const hrefs = hubEntries.map((e) => e.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("번호는 모두 1 이상의 정수다", () => {
    for (const e of hubEntries) {
      expect(Number.isInteger(e.no)).toBe(true);
      expect(e.no).toBeGreaterThan(0);
    }
  });

  it("nextNo 는 아직 아무도 쓰지 않은 번호를 준다", () => {
    expect(entryByNo(nextNo())).toBeUndefined();
  });
});

describe("clusters 와의 정합", () => {
  it("허브의 모든 주소가 clusters 에 실제로 있다", () => {
    for (const e of hubEntries) {
      expect(clusterHrefs).toContain(e.href);
    }
  });

  it("clusters 의 모든 글이 번호를 받았다 — 새 글을 추가하면 여기서 깨진다", () => {
    const hubHrefs = hubEntries.map((e) => e.href);
    const missing = clusterHrefs.filter((h) => !hubHrefs.includes(h));
    expect(missing).toEqual([]);
  });

  it("kind 가 clusters 와 일치한다", () => {
    for (const e of hubEntries) {
      const link = clusters
        .flatMap((c) => c.links)
        .find((l) => l.href === e.href);
      expect(link?.kind).toBe(e.kind);
    }
  });
});

describe("표시용 라벨", () => {
  it.each(hubEntries)("$no · 라벨이 비어 있지 않고 30자 이내다", (e) => {
    expect(e.label.length).toBeGreaterThan(0);
    // 모바일 한 줄에 안 들어가면 번호를 찾기 어려워진다.
    expect(e.label.length).toBeLessThanOrEqual(30);
  });
});

describe("허브 묶음", () => {
  it("모든 항목이 정확히 한 묶음에만 들어간다 — 빠지거나 겹치면 번호를 못 찾는다", () => {
    const grouped = hubGroups.flatMap((g) => g.entries.map((e) => e.no));
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(grouped.sort((a, b) => a - b)).toEqual(
      hubEntries.map((e) => e.no).sort((a, b) => a - b),
    );
  });

  it("빈 묶음이 없다", () => {
    for (const g of hubGroups) expect(g.entries.length).toBeGreaterThan(0);
  });
});
