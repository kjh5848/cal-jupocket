import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import s from "../../rates/statement-2026.json";
import p from "../../rates/vat-penalty-2026.json";

const DIST = join(process.cwd(), "dist/guide/tax-invoice-vs-statement/index.html");
const built = existsSync(DIST);
const PAGE = built ? readFileSync(DIST, "utf-8") : "";

/**
 * 세금계산서 vs 계산서(47번).
 *
 * 이 글이 조용히 틀릴 수 있는 자리는 **어느 법인가**다. 계산서를
 * 부가가치세법 조문으로 적으면 가산세가 붙는 세목까지 틀린다.
 */
describe("세금계산서와 계산서", () => {
  it("계산서는 소득세법·법인세법이고 부가가치세법이 아니다", () => {
    expect(s.issue.article).toContain("소득세법");
    expect(s.penalty.article).toBe("소득세법 제81조의10");
    expect(s.note).toContain("법인세법");
    expect(s.issue.article).not.toContain("부가가치세법");
  });

  it("제163조 제6항이 세금계산서 발급분을 걷어낸다", () => {
    expect(s.deemedIssued.article).toContain("제6항");
    expect(s.deemedIssued.rule).toContain("것으로 본다");
    expect(s.deemedIssued.rule).toContain("세금계산서");
  });

  it("가산세 요율이 세금계산서 쪽과 어긋나지 않는다", () => {
    const by = (k: string) => s.penalty.items.find((x) => x.key === k)!;
    expect(by("notIssued").rate).toBe(p.taxInvoice.notIssued);
    expect(by("wrongEntry").rate).toBe(p.taxInvoice.wrongEntry);
    expect(by("eTransmitLate").rate).toBe(p.taxInvoice.eTransmitLate);
    expect(by("eTransmitNone").rate).toBe(p.taxInvoice.eTransmitNone);
  });

  it("감경 요율이 본 요율보다 낮다", () => {
    for (const x of s.penalty.items) {
      if (!x.relief) continue;
      expect(x.relief.rate, x.key).toBeLessThan(x.rate);
    }
  });

  it("중복 부과하지 않는다는 조항이 들어 있다", () => {
    expect(s.penalty.noDoubleCharge.rule).toContain("적용하지 않는다");
    expect(s.penalty.noDoubleCharge.rule).toContain("부가가치세법 제60조");
  });

  it.skipIf(!built)("'면세' 를 조문의 출발점으로 쓰지 않는다", () => {
    expect(s.issue.noExemptWord).toContain("'면세' 라는 말을 쓰지 않는다");
    expect(PAGE).toContain("면세");
    expect(PAGE).toContain("제163조");
  });

  it("발급시기는 '공급하는 때' 뿐이고 연장 규정이 없다", () => {
    // 2026-10-08 시행령 제211조 제1항에서 확인. 세금계산서의 다음 달 10일
    // 같은 길이 법·시행령·시행규칙 어디에도 없다.
    expect(s.issueTiming.article).toContain("제211조");
    expect(s.issueTiming.rule).toContain("공급하는 때");
    expect(s.issueTiming.searched).toHaveLength(3);
    // "없다" 가 아니라 "찾지 못했다" 로 적혀 있어야 한다.
    expect(s.issueTiming.noExtension).toContain("찾지 못했다");
  });

  it.skipIf(!built)("계산서에 날짜 기한을 지어내지 않는다", () => {
    const body = PAGE.replace(/<[^>]+>/g, " ");
    expect(body).not.toMatch(/계산서[^.]{0,24}(발급시기는|발급기한은)[^.]{0,12}\d+일/);
  });

  it("필요적 기재사항 넷에 세액이 없다", () => {
    // 세금계산서와 갈리는 자리다. 세액이 목록에 들어오면 틀린 글이 된다.
    expect(s.requiredEntries.list).toHaveLength(4);
    expect(s.requiredEntries.list.join(" ")).toContain("공급가액");
    expect(s.requiredEntries.list.join(" ")).not.toContain("세액");
  });

  it("영수증 발급 대상 간이과세자는 계산서도 못 끊는다", () => {
    expect(s.simplifiedCannotIssue.article).toContain("제211조 제3항");
    expect(s.simplifiedCannotIssue.rule).toContain("발급할 수 없으며");
  });

  it("전자계산서 의무 기준이 8천만원이고 7월 1일에 시작한다", () => {
    expect(s.electronic.whoResolved.rule).toContain("8천만원");
    expect(s.electronic.whoResolved.startDate).toContain("7월 1일");
  });
});
