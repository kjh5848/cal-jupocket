import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import r from "../../rates/vat-2026.json";

const C = r.taxInvoice.correction;
const DIST = join(process.cwd(), "dist/guide/tax-invoice-cancel/index.html");
const built = existsSync(DIST);
const PAGE = built ? readFileSync(DIST, "utf-8") : "";

/**
 * 세금계산서 발행 취소(46번) — 시행령 제70조.
 *
 * 이 글이 틀릴 수 있는 자리는 "작성일" 이다. 1~3호는 사유가 생긴 날을
 * 적으므로, 처음 세금계산서 작성일로 적으면 과세기간이 달라진다.
 * 2호(해제)와 3호(해지)를 바꿔 적으면 달라지는 것은 과세기간이 아니라
 * 금액이다 — 처음에 반대로 썼다가 되돌렸다.
 */
describe("세금계산서 발행 취소", () => {
  it("사유는 아홉 가지고 전부 작성일이 적혀 있다", () => {
    expect(C.reasons).toHaveLength(9);
    for (const x of C.reasons) {
      expect(x.writeDate, `${x.no}호`).toBeTruthy();
      expect(x.how, `${x.no}호`).toBeTruthy();
    }
  });

  it("해제는 계약해제일, 해지는 증감 사유 발생일이다", () => {
    const 해제 = C.reasons.find((x) => x.no === 2)!;
    const 해지 = C.reasons.find((x) => x.no === 3)!;
    expect(해제.writeDate).toBe("계약해제일");
    expect(해지.writeDate).toBe("증감 사유가 발생한 날");
    expect(해제.writeDate).not.toBe(해지.writeDate);
  });

  it("조문에 기한이 적힌 사유는 제6호 하나뿐이다", () => {
    const withDeadline = C.reasons.filter((x) => "deadline" in x);
    expect(withDeadline.map((x) => x.no)).toEqual([6]);
    expect(withDeadline[0].deadline).toContain("1년");
    expect(withDeadline[0].deadline).toContain("확정신고기한");
  });

  it("나머지 사유에 '기한이 없다' 고 단정하지 않는다", () => {
    // 제70조가 작성일만 정해 둔 것이지, 기한이 없다고 읽을 근거는 없다.
    expect(C.deadlineNote).toContain("확인하지 못했다");
    expect(C.deadlineNote).not.toContain("기한이 따로 없다");
  });

  it("1~3호의 작성일은 사유 발생일이고, 그게 금액 차이와 별개다", () => {
    // 해제와 해지를 바꿔 적으면 달라지는 것은 과세기간이 아니라 금액이다.
    expect(C.writeDateIsEventDate).toContain("사유가 생긴 날");
    expect(C.amountDiffers).toContain("과세기간이 아니라 금액");
  });

  it("경정을 미리 알고 있으면 막히는 경우가 네 가지다", () => {
    expect(C.blocked.cases).toHaveLength(4);
    expect(C.blocked.cases[0]).toContain("세무조사");
    expect(C.blocked.rule).toContain("미리 알고 있는 경우");
  });

  it.skipIf(!built)("'지운다' 가 아니라 음(陰)의 표시라고 쓴다", () => {
    expect(C.noCancelConcept).toContain("음(陰)");
    expect(PAGE).toContain("음(陰)");
    expect(PAGE).toContain("수정세금계산서");
  });

  it.skipIf(!built)("검색어 '취소' 가 제목과 소제목에 있다", () => {
    expect(PAGE).toMatch(/<h1[^>]*>[^<]*취소/);
    expect((PAGE.match(/<h2[^>]*>[^<]*취소/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it.skipIf(!built)("확인 못 한 가산세를 숫자로 쓰지 않는다", () => {
    // 수정분의 '발급시기' 를 제60조가 어떻게 보는지 확인하지 않았다.
    expect(r.taxInvoice.notVerified.join(" ")).toContain("지연발급 가산세");
    expect(PAGE).toContain("확인하지 못했습니다");
  });
});
