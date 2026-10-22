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

  it("빈칸이던 세액공제·세부담 상한은 2026-10-13 원문으로 채웠다", () => {
    // 앞 버전은 '안 읽었다' 를 지켰다. 원문을 읽고 채웠으므로 확인된 값을 고정한다.
    expect(r.oneHomeCredit.age.map((x) => x.rate)).toEqual([0.2, 0.3, 0.4]);
    expect(r.oneHomeCredit.hold.map((x) => x.rate)).toEqual([0.2, 0.4, 0.5]);
    expect(r.oneHomeCredit.cap).toBe(0.8);
    expect(r.burdenCap.rate).toBe(1.5);
    // 재산세액 공제는 식만 읽고 계산기에는 넣지 않았다 — 그 사실은 남긴다
    // 2026-10-22 집행기준 9-4의3 으로 산식 해석이 닫혀 notVerified 에서 빠졌다 — 보유세 lib(holding-tax)가 쓰고, 종부세 계산기는 아직 공제 전 상한
    expect(r.notVerified.join(" ")).not.toMatch(/재산세액 공제/);
    expect(r.propertyTaxCredit.verifiedOn).toBe("2026-10-22");
    expect(r.propertyTaxCredit.note).toMatch(/누진공제를 빼지 않고/);
  });

  it("세율표가 조문 표에서 왔음을 밝힌다", () => {
    expect(r.rates.upTo2Homes.article).toContain("(표)");
    expect(r.rates.from3Homes.article).toContain("(표)");
  });
});

describe("1세대 1주택 세액공제·농특세(2026-10-13 추가)", async () => {
  const { oneHomeCreditRate, estimate, jointCompare, compute } = await import("../comprehensive-property-tax");
  it("나이: 60세 20%, 65세 30%, 70세 40%", () => {
    expect(oneHomeCreditRate(59, 0).age).toBe(0);
    expect(oneHomeCreditRate(60, 0).age).toBe(0.2);
    expect(oneHomeCreditRate(65, 0).age).toBe(0.3);
    expect(oneHomeCreditRate(70, 0).age).toBe(0.4);
  });
  it("보유: 5년 20%, 10년 40%, 15년 50%", () => {
    expect(oneHomeCreditRate(0, 4).hold).toBe(0);
    expect(oneHomeCreditRate(0, 5).hold).toBe(0.2);
    expect(oneHomeCreditRate(0, 10).hold).toBe(0.4);
    expect(oneHomeCreditRate(0, 15).hold).toBe(0.5);
  });
  it("합계는 80%까지(제9조 ⑤)", () => expect(oneHomeCreditRate(72, 16).total).toBe(0.8));
  it("공시가격 20억 1세대 1주택: 과세표준 4.8억 → 150만 + 1.8억×0.7% = 276만원", () => {
    expect(compute({ totalPrice: 2_000_000_000, oneHome: true }).tax).toBe(2_760_000);
  });
  it("공제 없으면 농특세 20%를 더한다", () => {
    const e = estimate({ totalPrice: 2_000_000_000, oneHome: true, age: 50, years: 3 });
    expect(e.rural).toBe(552_000);
    expect(e.total).toBe(3_312_000);
  });
  it("70세·15년이면 80% 공제", () => {
    const e = estimate({ totalPrice: 2_000_000_000, oneHome: true, age: 70, years: 15 });
    expect(e.credit).toBe(2_208_000);
    expect(e.afterCredit).toBe(552_000);
  });
  it("공동명의: 공시가격 18억이면 각자 9억이라 둘 다 0원", () => {
    expect(jointCompare(1_800_000_000, 50, 3).separate).toBe(0);
  });
  it("공동명의: 공시가격 30억·70세·15년이면 1주택자 신청이 더 적다", () => {
    const j = jointCompare(3_000_000_000, 70, 15);
    expect(j.asOne).toBeLessThan(j.separate);
  });
});

describe("계산기 페이지 jongbuPage — 손계산(제8조 ①·제9조 ①·제20조·농특세법 제5조)", async () => {
  const { jongbuPage } = await import("../comprehensive-property-tax");
  it("20억 1세대 1주택 50세·3년: 합계 3,312,000 · 9억 공제였다면 5,040,000 → 1,728,000 줄어듦 · 분납 260,000", () => {
    const p = jongbuPage({ totalPrice: 20 * 억, kind: "one", age: 50, years: 3 });
    expect(p.total).toBe(3_312_000);
    expect(p.oneHomeSaving).toBe(1_728_000);
    expect(p.installment).toBe(260_000);
    expect(p.room).toBe(0);
  });
  it("10억 1세대 1주택: 0원 · 12억까지 2억 남음 · 9억 공제였다면 360,000", () => {
    const p = jongbuPage({ totalPrice: 10 * 억, kind: "one" });
    expect(p.total).toBe(0);
    expect(p.room).toBe(2 * 억);
    expect(p.oneHomeSaving).toBe(360_000);
  });
  it("13억 2주택 이하: 과표 2.4억 → 1,200,000 + 농특세 240,000 · 1주택이었다면 1,080,000 덜", () => {
    const p = jongbuPage({ totalPrice: 13 * 억, kind: "two" });
    expect(p.total).toBe(1_440_000);
    expect(p.oneHomeSaving).toBe(1_080_000);
    expect(p.multiExtra).toBe(0);
  });
  it("30억 3주택 이상: 과표 12.6억 → 10,800,000 · 2주택 이하보다 504,000 더 · 분납 절반", () => {
    const p = jongbuPage({ totalPrice: 30 * 억, kind: "three" });
    expect(p.tax).toBe(10_800_000);
    expect(p.total).toBe(12_960_000);
    expect(p.multiExtra).toBe(504_000);
    expect(p.installment).toBe(5_400_000);
  });
  it("70세·15년이면 공제율 40% + 50% → 80%로 묶임", () => {
    const p = jongbuPage({ totalPrice: 20 * 억, kind: "one", age: 70, years: 15 });
    expect([p.ageRate, p.holdRate, p.creditRate]).toEqual([0.4, 0.5, 0.8]);
    expect(p.total).toBe(662_400);
  });
});
