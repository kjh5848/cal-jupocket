/** 리브랜딩 Task 7 — 공통 계산기 틀: 금액 읽어 주기·비율·프리셋 출처·마크업 계약(점진적 향상). */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { readWon, shares } from "../calc-ui";
import { calcPresets } from "../../data/calc-presets";

describe("금액 읽어 주기", () => {
  it.each([
    [0, ""], [NaN, ""], [-5, ""], [9500, "9,500원"], [10000, "1만원"], [200000, "20만원"],
    [36000000, "3,600만원"], [4166666, "416만 6,666원"], [100000000, "1억원"], [120000000, "1억 2,000만원"], [1234567890, "12억 3,456만원"],
  ])("%s → %s", (n, s) => expect(readWon(n as number)).toBe(s));
});

describe("비율", () => {
  it("합 0 이면 전부 0", () => expect(shares([0, 0, 0])).toEqual([0, 0, 0]));
  it("반올림 백분율", () => expect(shares([2665433, 272087, 62480])).toEqual([89, 9, 2]));
  it("음수·NaN 은 0 으로", () => expect(shares([-1, NaN, 5])).toEqual([0, 0, 100]));
  it("합은 늘 100 — 국민연금 309만: 보험료 9.5% · 남는 소득 90.5%", () => expect(shares([293_550, 2_796_450])).toEqual([10, 90]));
  it("셋이 33.3% 씩이어도 100", () => expect(shares([1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(100));
});

describe("프리셋 금액은 자동완성에서", () => {
  for (const [page, sets] of Object.entries(calcPresets)) {
    for (const [key, set] of Object.entries(sets)) {
      it(`${page} ${key}`, () => {
        const lines = readFileSync(set.source, "utf-8").split(/\r?\n/).map((l) => l.split(",")[0]).filter((l) => l.includes(set.term));
        for (const a of set.amounts) {
          const man = a / 10000;
          const forms = [String(man), `${man}만`, man % 10000 === 0 ? `${man / 10000}억` : "", man % 10000 === 0 ? `${man / 10000} 억` : ""].filter(Boolean);
          expect(lines.some((l) => forms.some((f) => new RegExp(`(^|\s|[^0-9])${f.replace(/\s/g, "\s")}(\s|$|[^0-9])`).test(l))), `${a} in ${set.source}`).toBe(true);
        }
      });
    }
  }
});

const FILE = "dist/guide/take-home-calculator/index.html";
const built = existsSync(FILE);
describe.skipIf(!built)("실수령액 계산기 마크업 계약", () => {
  const html = built ? readFileSync(FILE, "utf-8") : "";
  it("스크립트가 없어도 쓸 수 있는 원래 입력이 그대로", () => {
    expect(html).toMatch(/<select[^>]*id="th-mode"/);
    expect(html).toMatch(/<input[^>]*type="number"[^>]*id="th-family"|<input[^>]*id="th-family"[^>]*type="number"/);
  });
  it("틀 표시가 붙어 있다", () => {
    for (const a of ["data-seg", "data-step", "data-won", "data-presets", "data-receipt", "data-bar", "data-dock", "data-two"]) expect(html, a).toContain(a);
  });
});
