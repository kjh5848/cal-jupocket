/**
 * 달력에 들어간 날짜는 전부 조문에서 왔는가.
 *
 * 이 파일이 막는 것은 하나다 — **달력은 지어내기가 너무 쉽다.** 열두 칸이
 * 있으면 빈 칸을 채우고 싶어지고, "자동차세는 6월·12월이잖아" 같은 상식이
 * 검증 없이 들어온다. 실제로 그 값은 원문에서 확인하지 못했다(제128조
 * 제1항의 기분 표가 이미지라 화면에 들어오지 않는다).
 *
 * 그래서 모든 항목에 조문과 출처 파일을 강제하고, 출처로 적은 rates 파일이
 * 실제로 존재하는지까지 본다.
 */
import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TAX_EVENTS,
  RELATIVE_DEADLINES,
  DOMAIN_LABEL,
  byMonth,
  byDomain,
  activeDomains,
} from "../../data/tax-calendar";
import local from "../../rates/local-tax-2026.json";

const RATES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../rates");
const rateFiles = new Set(readdirSync(RATES_DIR).filter((f) => f.endsWith(".json")));

describe("달력 항목은 전부 근거를 가진다", () => {
  it("모든 항목에 조문이 있다", () => {
    for (const e of TAX_EVENTS) {
      expect(e.article, e.label).toBeTruthy();
      expect(e.article.length, e.label).toBeGreaterThan(4);
    }
  });

  it("출처로 적은 rates 파일이 실제로 있다", () => {
    for (const e of [...TAX_EVENTS, ...RELATIVE_DEADLINES]) {
      expect(rateFiles.has(e.source), `${e.label} → ${e.source}`).toBe(true);
    }
  });

  it("달은 1~12 안에 있다", () => {
    for (const e of TAX_EVENTS) {
      expect(e.month, e.label).toBeGreaterThanOrEqual(1);
      expect(e.month, e.label).toBeLessThanOrEqual(12);
    }
  });

  it("누구에게 오는지가 비어 있지 않다", () => {
    // "국민 모두" 같은 빈 문장을 막을 수는 없지만, 아예 비는 것은 막는다.
    for (const e of TAX_EVENTS) expect(e.who.length, e.label).toBeGreaterThan(5);
  });
});

describe("확인하지 못한 것은 달력에 없다", () => {
  /*
   * 처음에는 "자동차세 본납기를 넣지 않았다" 를 강제했다. 원문 표가
   * 화면에 안 들어와 확인하지 못했기 때문이다. 같은 날 img 의 alt 에
   * 표가 그대로 있는 것을 찾아 채웠으므로 이 테스트를 뒤집는다.
   *
   * 뒤집되 근거를 묶어 둔다 — 조문 표기에 "(표)" 가 있어야 한다.
   * 상식으로 채운 값과 alt 에서 읽은 값을 코드가 구분하지 못하면
   * 다음 사람이 똑같이 상식으로 채운다.
   */
  it("자동차세 본납기는 조문 표에서 왔다는 표시를 달고 있다", () => {
    const main = byDomain("vehicle").filter((e) => e.month === 6 || e.month === 12);
    expect(main).toHaveLength(2);
    for (const e of main) expect(e.article, e.label).toContain("(표)");
  });

  it("분할납부는 여전히 단서 조문이다 — 신청한 사람만이라는 뜻", () => {
    const split = byDomain("vehicle").filter((e) => e.month === 3 || e.month === 9);
    for (const e of split) expect(e.article, e.label).toContain("단서");
  });

  it("local-tax 가 아직 확인 못 한 것을 스스로 적어 뒀다", () => {
    expect(local.vehicleTax.notVerified.length).toBeGreaterThan(0);
    expect(local.vehicleTax.notVerified.join(" ")).toMatch(/연납|표준세율/);
  });

  it("주민세는 금액을 확정하지 않는다 — 조례 위임이다", () => {
    expect(local.residentTax.rateCap).toBe(10000);
    expect(local.residentTax.rateNote).toContain("조례");
    // 달력의 주민세 칸이 금액을 단정하지 않는지
    const resident = TAX_EVENTS.find(
      (e) => e.label.includes("주민세") && e.kind === "고지",
    )!;
    expect(resident.who).toContain("조례");
  });
});

describe("지방세 날짜는 원문과 같다", () => {
  it("재산세 과세기준일 6월 1일 · 주민세 과세기준일 7월 1일", () => {
    expect(local.propertyTax.assessmentDate).toBe("6월 1일");
    expect(local.residentTax.assessmentDate).toBe("7월 1일");
  });

  it("주민세 납기 8월 16~31일", () => {
    expect(local.residentTax.from).toBe("8월 16일");
    expect(local.residentTax.to).toBe("8월 31일");
  });

  it("재산세는 7월과 9월 두 번이고 토지는 9월뿐이다", () => {
    const july = local.propertyTax.periods.filter((p) => p.from === "7월 16일");
    const sept = local.propertyTax.periods.filter((p) => p.from === "9월 16일");
    expect(july.map((p) => p.subject)).toContain("건축물");
    expect(sept.map((p) => p.subject)).toContain("토지");
    expect(july.map((p) => p.subject)).not.toContain("토지");
  });
});

describe("두 축이 같은 데이터를 본다", () => {
  it("달로 모은 것과 영역으로 모은 것의 합이 같다", () => {
    const byMonths = Array.from({ length: 12 }, (_, i) => byMonth(i + 1).length).reduce(
      (a, b) => a + b,
      0,
    );
    const byDomains = activeDomains().reduce((a, d) => a + byDomain(d).length, 0);
    expect(byMonths).toBe(TAX_EVENTS.length);
    expect(byDomains).toBe(TAX_EVENTS.length);
  });

  it("영역 라벨이 전부 있다", () => {
    for (const e of TAX_EVENTS) expect(DOMAIN_LABEL[e.domain], e.label).toBeTruthy();
  });

  it("상속·증여는 달력이 아니라 상대 기한으로 들어간다", () => {
    // 사망일·증여일 기준이라 "몇 월"이 없다. 달력에 넣으면 거짓말이다.
    expect(TAX_EVENTS.some((e) => e.domain === "wealth")).toBe(false);
    expect(RELATIVE_DEADLINES.some((d) => d.domain === "wealth")).toBe(true);
  });
});
