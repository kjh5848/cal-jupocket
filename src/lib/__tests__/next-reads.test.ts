/**
 * 글 끝 "이어서 볼 글" 선택 규칙.
 *
 * 독자를 계속 돌리는 장치라, 비거나 자기 자신을 가리키거나 한 주제에
 * 갇히면 목적을 잃는다. 그 세 가지를 막는다.
 */
import { describe, it, expect } from "vitest";
import { clusters, nextReads } from "../../data/clusters";

const guidePaths = clusters.flatMap((c) =>
  c.links.filter((l) => l.kind === "guide").map((l) => l.href),
);

describe("nextReads", () => {
  it("클러스터에 없는 경로면 빈 배열", () => {
    expect(nextReads("/없는-경로/")).toEqual([]);
  });

  it.each(guidePaths)("%s — 3개를 채운다", (path) => {
    expect(nextReads(path)).toHaveLength(3);
  });

  it.each(guidePaths)("%s — 자기 자신을 추천하지 않는다", (path) => {
    for (const r of nextReads(path)) {
      expect(r.link.href).not.toBe(path);
    }
  });

  it.each(guidePaths)("%s — 중복이 없다", (path) => {
    const hrefs = nextReads(path).map((r) => r.link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it.each(guidePaths)("%s — 다른 주제를 최소 1개 섞는다", (path) => {
    expect(nextReads(path).some((r) => r.crossCluster)).toBe(true);
  });

  it.each(guidePaths)("%s — 계산기를 최소 1개 포함한다", (path) => {
    expect(nextReads(path).some((r) => r.link.kind === "calc")).toBe(true);
  });

  it("같은 글은 늘 같은 결과를 준다 (무작위 금지)", () => {
    const a = nextReads("/guide/vat-filing/").map((r) => r.link.href);
    const b = nextReads("/guide/vat-filing/").map((r) => r.link.href);
    expect(a).toEqual(b);
  });

  it("글마다 다른 곳을 가리킨다 — 전부 같은 3개면 순환이 안 된다", () => {
    const sets = guidePaths.map((p) =>
      nextReads(p).map((r) => r.link.href).join("|"),
    );
    expect(new Set(sets).size).toBeGreaterThan(1);
  });

  it("limit 을 지킨다", () => {
    expect(nextReads("/guide/vat-filing/", 2)).toHaveLength(2);
  });
});

describe("계산기에서 이어서 볼 글", () => {
  const calcPaths = clusters.flatMap((c) =>
    c.links.filter((l) => l.kind === "calc").map((l) => l.href),
  );

  it("계산기도 결과를 받는다", () => {
    expect(calcPaths.length).toBe(7);
    for (const p of calcPaths) {
      expect(nextReads(p).length, p).toBeGreaterThan(0);
    }
  });

  it("첫 번째는 같은 주제의 글이다", () => {
    // 계산기는 guide 만 걸러낸 배열에 없어서 findIndex 가 -1 이 됐고,
    // 그 결과 어느 계산기든 클러스터의 첫 글을 권했다 — 가산세 계산기가
    // 3.3% 글을 권하고 있었다. 가장 가까운 글이 나와야 한다.
    for (const p of calcPaths) {
      const first = nextReads(p)[0];
      expect(first.link.kind, p).toBe("guide");
      expect(first.crossCluster, p).toBe(false);
    }
  });

  it("가산세 계산기는 가산세 글을 먼저 권한다", () => {
    expect(nextReads("/penalty/")[0].link.href).toBe(
      "/guide/late-filing-penalty/",
    );
  });

  it("계산기마다 첫 글이 다르다", () => {
    const firsts = calcPaths.map((p) => nextReads(p)[0].link.href);
    // 같은 클러스터의 계산기끼리는 겹칠 수 있지만 전부 같으면 예전 버그다.
    expect(new Set(firsts).size).toBeGreaterThan(1);
  });
});
