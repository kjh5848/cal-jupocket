import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import r from "../../rates/vat-2026.json";

const S = r.taxInvoice.simplified;
/**
 * 소스가 아니라 **빌드된 HTML** 을 읽는다. .astro 를 읽으면 파일 맨 위
 * JSDoc 에 "직전 연도"·"제69조"·"7월 1일" 이 다 들어 있어서, 본문을 통째로
 * 지워도 통과한다. 주석을 검사하는 테스트는 아무것도 지키지 못한다.
 */
const DIST = join(process.cwd(), "dist/guide/simplified-tax-invoice/index.html");
const built = existsSync(DIST);
const PAGE = built ? readFileSync(DIST, "utf-8") : "";

/**
 * 간이과세자 세금계산서(45번) — 조문에서 틀리기 쉬운 두 자리를 박아 둔다.
 *
 * 둘 다 "같은 숫자가 다른 뜻으로 쓰인다" 는 함정이라, 누가 나중에 json 을
 * 정리하면서 합쳐 버리면 글이 조용히 틀린 말을 하게 된다.
 */
describe("간이과세자 세금계산서", () => {
  it("영수증 발급 대상은 둘뿐이고, 기준은 직전 연도 4,800만원이다", () => {
    expect(S.receiptInstead.cases).toHaveLength(2);
    expect(S.receiptInstead.cases[0].amount).toBe(48_000_000);
    expect(S.receiptInstead.cases[0].label).toContain("직전 연도");
    expect(S.receiptInstead.cases[1].label).toContain("신규로 사업을 시작");
    expect(S.receiptInstead.article).toContain("제36조");
  });

  it("4,800만원 미만은 '발급 금지' 가 아니라 '영수증 발급 의무' 로 적혀 있다", () => {
    // 조문은 못 끊게 막는 형식이 아니라 영수증을 발급하라는 형식이다.
    expect(S.receiptInstead.note).toContain("영수증");
    expect(S.canIssue.rule).toContain("4,800만원 이상");
  });

  it("적용기간은 달력 연도가 아니라 7월 1일~다음 해 6월 30일이다", () => {
    // 여기가 1월로 바뀌면 시점이 통째로 반년 틀어진다.
    expect(S.applyPeriod.rule).toContain("7월 1일");
    expect(S.applyPeriod.rule).toContain("6월 30일");
    expect(S.applyPeriod.article).toContain("제36조의2");
    expect(S.applyPeriod.newBusiness).toContain("6월 30일");
  });

  it("발급 기준(제36조)과 납부면제(제69조)는 보는 연도가 다르다", () => {
    // 금액이 같아서 붙어 다니지만 하나는 직전 연도, 하나는 해당 과세기간이다.
    expect(r.simplified.paymentExemptionUnder).toBe(48_000_000);
    expect(r.simplified.paymentExemptionNote).toContain("해당 과세기간");
    expect(S.receiptInstead.cases[0].label).toContain("직전 연도");
  });

  it.skipIf(!built)("글이 두 기준을 분리해서 보여 준다", () => {
    expect(PAGE).toContain("직전 연도");
    expect(PAGE).toContain("해당 과세기간");
    expect(PAGE).toContain("제69조");
    expect(PAGE).toContain("7월 1일");
  });

  it.skipIf(!built)("요구하면 발급해야 한다고 쓰지 않는다 — 시행령 제73조 제10항", () => {
    // 처음에 반대로 적었던 자리다. 간이과세자는 영수증 적용기간에
    // 제36조 제3항~제5항의 적용을 받지 않는다.
    expect(S.onRequest.simplifiedExcluded).toContain("적용하지 않는다");
    expect(PAGE).toContain("제73조");
    expect(PAGE).toContain("제10항");
  });

  it.skipIf(!built)("검색어 '발행' 이 제목과 소제목에 있다", () => {
    // 자동완성 9개가 전부 "간이과세자 세금계산서 발행 …" 이다.
    expect(PAGE).toMatch(/<h1[^>]*>[^<]*발행/);
    expect((PAGE.match(/<h2[^>]*>[^<]*발행/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("세무서 통지 의무가 기간 시작 20일 전으로 적혀 있다", () => {
    expect(S.notice.rule).toContain("20일 전");
    expect(S.notice.article).toContain("제73조의2");
  });

  it.skipIf(!built)("안 읽은 것을 밝힌다", () => {
    expect(r.taxInvoice.notVerified.join(" ")).toContain("제73조 제1항");
    expect(PAGE).toContain("이 글에 없는 것");
  });
});
