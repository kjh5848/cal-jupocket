/** 리브랜딩 Task 6 — 내가 써 본 도구(그 브라우저에만 저장). 저장소가 막혀도 깨지지 않는다. */
import { describe, it, expect } from "vitest";
import { markUsed, usedSet, USED_KEY } from "../collect";

const throwing = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); } } as unknown as Storage;
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as unknown as Storage; };

describe("수집", () => {
  it("막힌 저장소 — false · 빈 Set", () => {
    expect(markUsed("/vat/", throwing)).toBe(false);
    expect(usedSet(throwing).size).toBe(0);
    expect(usedSet(null).size).toBe(0);
  });
  it("처음만 true, 두 번째 false", () => {
    const s = mem();
    expect(markUsed("/vat/", s)).toBe(true);
    expect(markUsed("/vat/", s)).toBe(false);
    expect([...usedSet(s)]).toEqual(["/vat/"]);
  });
  it("깨진 값·배열 아닌 값 → 빈 Set", () => {
    const s = mem();
    s.setItem(USED_KEY, "{oops");
    expect(usedSet(s).size).toBe(0);
    s.setItem(USED_KEY, '{"a":1}');
    expect(usedSet(s).size).toBe(0);
    expect(markUsed("/vat/", s)).toBe(true);
  });
});
