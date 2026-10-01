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

  it.skipIf(!built)("확인 못 한 발급시기를 날짜로 쓰지 않는다", () => {
    expect(s.notVerified.join(" ")).toContain("계산서의 발급시기");
    // 시행령을 안 읽었으므로 "계산서는 …일까지" 같은 문장이 있으면 안 된다.
    const body = PAGE.replace(/<[^>]+>/g, " ");
    expect(body).not.toMatch(/계산서[^.]{0,20}(발급시기는|발급기한은)\s*\S*\s*\d+일/);
  });
});
