/**
 * 종합부동산세 — 뼈대만 계산한다는 것을 테스트가 지킨다.
 *
 * 고령자·장기보유 세액공제와 재산세액 공제를 넣지 않았다. 그것들이
 * 실제 세액을 크게 낮추므로 **여기 값은 상한에 가까운 어림값**이다.
 * 그 사실이 rates 의 notVerified 에 남아 있는지까지 본다 —
 * 어림값을 정확한 값처럼 쓰는 것이 이 주제에서 가장 위험하다.
 */
import { describe, it, expect } from "vitest";
import {
  deductionFor,
  taxBase,
  taxOn,
  compute,
  installmentAmount,
  RATIO,
  SAME_UNTIL,
} from "../comprehensive-property-tax";
import r from "../../rates/comprehensive-property-2026.json";

const 억 = 100_000_000;

describe("공제 — 대부분은 0원이다", () => {
  it("1세대 1주택은 12억, 그 밖은 9억", () => {
    expect(deductionFor(true)).toBe(12 * 억);
    expect(deductionFor(false)).toBe(9 * 억);
  });

  it("공시가격이 공제 이하면 과세표준이 0이다", () => {
    expect(taxBase(11 * 억, true)).toBe(0);
    expect(taxBase(8 * 억, false)).toBe(0);
    expect(compute({ totalPrice: 11 * 억, oneHome: true }).exempt).toBe(true);
  });

  it("음수가 되지 않는다 — 제8조 제1항 단서", () => {
    expect(taxBase(1 * 억, true)).toBe(0);
  });
});

describe("과세표준 — 공정시장가액비율 60%", () => {
  it("(공시가격 − 공제) × 60%", () => {
    expect(RATIO).toBe(0.6);
    // 1세대1주택 20억 → (20−12)억 × 60% = 4.8억
    expect(taxBase(20 * 억, true)).toBe(480_000_000);
    // 그 밖 20억 → (20−9)억 × 60% = 6.6억
    expect(taxBase(20 * 억, false)).toBe(660_000_000);
  });
});

describe("세율표 — 제9조 제1항", () => {
  it("3억 이하는 0.5%", () => {
    expect(taxOn(3 * 억, "upTo2Homes")).toBe(1_500_000);
    expect(taxOn(3 * 억, "from3Homes")).toBe(1_500_000);
  });

  it("12억까지는 두 표가 같다", () => {
    expect(SAME_UNTIL).toBe(12 * 억);
    for (const b of [3 * 억, 6 * 억, 12 * 억]) {
      expect(taxOn(b, "upTo2Homes"), `${b}`).toBe(taxOn(b, "from3Homes"));
    }
  });

  it("12억을 넘으면 갈린다 — 1.3% 대 2.0%", () => {
    const 이하 = taxOn(20 * 억, "upTo2Homes");
    const 이상 = taxOn(20 * 억, "from3Homes");
    expect(이상).toBeGreaterThan(이하);
    // 20억: 960만 + 8억×1.3% = 2,000만 / 960만 + 8억×2.0% = 2,560만
    expect(이하).toBe(20_000_000);
    expect(이상).toBe(25_600_000);
  });
});

describe("분납 — 시행령 제16조 제1항", () => {
  it("250만원 이하면 나눌 수 없다", () => {
    expect(installmentAmount(2_500_000)).toBe(0);
  });

  it("250만~500만은 250만원을 뺀 금액", () => {
    expect(installmentAmount(4_000_000)).toBe(1_500_000);
  });

  it("500만원을 넘으면 절반까지", () => {
    expect(installmentAmount(10_000_000)).toBe(5_000_000);
  });
});

describe("어림값이라는 것을 남겨 둔다", () => {
  it("국세라는 것을 적어 뒀다", () => {
    expect(r.isNationalTax).toBe(true);
    expect(r.isNationalTaxNote).toContain("재산세는 지방세");
  });

  it("세액을 낮추는 공제들을 안 읽었다고 적어 뒀다", () => {
    const s = r.notVerified.join(" ");
    expect(s).toMatch(/고령자|장기보유/);
    expect(s).toMatch(/재산세액 공제/);
    expect(s).toMatch(/세부담 상한/);
  });

  it("세율표가 조문 표에서 왔음을 밝힌다", () => {
    expect(r.rates.upTo2Homes.article).toContain("(표)");
    expect(r.rates.from3Homes.article).toContain("(표)");
  });
});
