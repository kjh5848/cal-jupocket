import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pa from "../../rates/pension-account-2026.json";

const DIST = join(process.cwd(), "dist/guide/irp-tax-credit/index.html");
const built = existsSync(DIST);
const HTML = built ? readFileSync(DIST, "utf-8") : "";
const TEXT = HTML.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

/**
 * IRP 세액공제(49번) — 소득세법 제59조의3, 같은 법 시행령 제118조의2·제118조의3.
 *
 * 이 글이 틀리기 쉬운 자리 셋을 고정한다.
 *  - "이월" 을 자동처럼 쓰는 것. 조문은 전환 '신청' 이다
 *  - 퇴직금이 들어온 IRP 를 공제 대상처럼 쓰는 것
 *  - 소제목이 자동완성 검색어를 잃는 것
 */
describe("IRP 세액공제", () => {
  it("이월은 신청이다", () => {
    expect(pa.carryover.article).toContain("제118조의3");
    expect(pa.carryover.rule).toContain("신청");
    expect(pa.carryover.note).toContain("자동 이월이 아니라");
  });

  it("과세이연 퇴직소득은 공제 대상에서 빠진다", () => {
    expect(pa.excluded.list[0]).toContain("퇴직소득");
  });

  it("마감은 12월 31일이다", () => {
    expect(pa.deadline.rule).toContain("12월 31일");
  });

  it("ISA 전환은 만기 60일 안이어야 한다", () => {
    expect(pa.isaTransfer.window.days).toBe(60);
  });

  it.skipIf(!built)("계산표 금액이 계산 함수와 같다", () => {
    // IRP 900만원 · 15% → 1,485,000 / 12% → 1,188,000
    expect(TEXT).toContain("1,485,000원");
    expect(TEXT).toContain("1,188,000원");
  });

  it.skipIf(!built)("자동완성 묶음이 소제목에 있다", () => {
    const h2 = [...HTML.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]+>/g, ""));
    for (const word of ["조건", "한도", "계산", "언제까지", "이월", "받는 법", "단점"]) {
      expect(h2.some((h) => h.includes(word)), word).toBe(true);
    }
  });

  it.skipIf(!built)("이월을 자동으로 된다고 쓰지 않는다", () => {
    expect(TEXT).toContain("신청해야 넘어갑니다");
    expect(TEXT).not.toMatch(/자동으로 (이월|넘어갑니다)/);
  });
});
