/**
 * 재산세 — 조문 원문과 대조한다.
 *
 * 세율표는 법령 사이트가 이미지로 싣는다. 그 이미지의 대체 텍스트에
 * 표가 들어 있어서 옮겼는데, **alt 만 보면 어느 표가 어느 조문 것인지
 * 알 수 없다.** 그래서 DOM 순서로 조문을 붙여 확인한 뒤에 옮겼고,
 * 여기서는 그 값이 코드에 제대로 들어왔는지를 다시 본다.
 */
import { describe, it, expect } from "vitest";
import {
  taxBase,
  baseTax,
  bill,
  halfInstallment,
  burdenCapApplies,
  BURDEN_CAP,
  BASE_CAP_RATE,
  LUMP_SUM_UNDER,
} from "../property-tax";
import r from "../../rates/local-tax-2026.json";

const 억 = 100_000_000;
const 만 = 10_000;

describe("과세표준 — 시가표준액 × 공정시장가액비율", () => {
  it("그 밖의 주택은 60%", () => {
    expect(taxBase({ standardValue: 3 * 억, kind: "house" })).toBe(180_000_000);
  });

  it("토지·건축물은 70%", () => {
    expect(taxBase({ standardValue: 1 * 억, kind: "building" })).toBe(70_000_000);
  });

  it("2026년 1세대 1주택은 시가표준액 구간별로 43·44·45%", () => {
    // 3억 이하 43% / 6억 이하 44% / 초과 45%
    expect(taxBase({ standardValue: 3 * 억, kind: "house", oneHome: true })).toBe(129_000_000);
    expect(taxBase({ standardValue: 5 * 억, kind: "house", oneHome: true })).toBe(220_000_000);
    expect(taxBase({ standardValue: 10 * 억, kind: "house", oneHome: true })).toBe(450_000_000);
  });

  it("9억을 넘는 1세대1주택도 특례 구간에 들어간다", () => {
    // 시행령 제109조 제1항 제2호 단서가 "시가표준액이 9억원을 초과하는
    // 주택을 포함한다" 고 못박았다. 9억에서 잘린다고 넘겨짚기 쉽다.
    const 열억 = taxBase({ standardValue: 10 * 억, kind: "house", oneHome: true });
    expect(열억 / (10 * 억)).toBeCloseTo(0.45, 5);
  });
});

describe("주택 세율 — 제111조 제1항 제3호 나목", () => {
  it("6천만원 이하는 0.1%", () => {
    // 과세표준 6천만원 = 시가표준액 1억 × 60%
    expect(baseTax({ standardValue: 1 * 억, kind: "house" })).toBe(60_000);
  });

  it("6천만원을 넘으면 6만원 + 초과분 0.15%", () => {
    // 과세표준 1억 2천만 → 60,000 + 6천만 × 0.0015 = 150,000
    expect(baseTax({ standardValue: 2 * 억, kind: "house" })).toBe(150_000);
  });

  it("3억원을 넘으면 57만원 + 초과분 0.4%", () => {
    // 과세표준 6억 → 570,000 + 3억 × 0.004 = 1,770,000
    expect(baseTax({ standardValue: 10 * 억, kind: "house" })).toBe(1_770_000);
  });
});

describe("1세대 1주택 세율 특례 — 제111조의2", () => {
  it("구간마다 그 밖의 주택보다 낮다", () => {
    for (const v of [1 * 억, 3 * 억, 5 * 억, 10 * 억]) {
      const 일반 = baseTax({ standardValue: v, kind: "house" });
      const 특례 = baseTax({ standardValue: v, kind: "house", oneHome: true });
      expect(특례, `${v / 억}억`).toBeLessThan(일반);
    }
  });

  it("5억짜리 집이면 특례가 절반 아래다", () => {
    // 일반: 과표 3억 → 195,000 + 1.5억 × 0.0025 = 570,000
    // 특례: 과표 2.2억 → 120,000 + 0.7억 × 0.002 = 260,000
    expect(baseTax({ standardValue: 5 * 억, kind: "house" })).toBe(570_000);
    expect(baseTax({ standardValue: 5 * 억, kind: "house", oneHome: true })).toBe(260_000);
  });
});

describe("고지서 — 본세만이 아니다", () => {
  const 집 = { standardValue: 5 * 억, kind: "house" as const, oneHome: true };

  it("지방교육세가 본세의 20% 더 붙는다", () => {
    const b = bill(집);
    expect(b.propertyTax).toBe(260_000);
    expect(b.educationTax).toBe(52_000);
  });

  it("도시지역이면 과세표준의 0.14%가 더 붙는다", () => {
    const b = bill({ ...집, urban: true });
    // 과세표준 2.2억 × 0.0014 = 308,000
    expect(b.urbanArea).toBe(308_000);
  });

  it("지방교육세는 도시지역분을 빼고 계산한다 — 제151조 제1항 제6호", () => {
    const 도시 = bill({ ...집, urban: true });
    const 비도시 = bill(집);
    expect(도시.educationTax).toBe(비도시.educationTax);
  });

  it("합계가 본세보다 크다 — 계산기와 고지서가 다른 이유", () => {
    const b = bill({ ...집, urban: true });
    expect(b.total).toBe(260_000 + 308_000 + 52_000);
    expect(b.total).toBeGreaterThan(b.propertyTax * 2);
  });

  it("본세가 2천원 미만이면 징수하지 않는다 — 제119조", () => {
    expect(bill({ standardValue: 300 * 만, kind: "house" }).collected).toBe(false);
    expect(bill({ standardValue: 5 * 억, kind: "house" }).collected).toBe(true);
  });
});

describe("나눠 내기와 상한", () => {
  it("주택은 절반씩 7월과 9월", () => {
    expect(halfInstallment(570_000)).toBe(285_000);
  });

  it("주택분 20만원 이하는 7월에 한 번에 올 수 있다", () => {
    expect(LUMP_SUM_UNDER).toBe(200_000);
  });

  it("세부담 상한 150%는 주택에 적용하지 않는다 — 제122조 단서", () => {
    // 2023. 3. 14. 개정으로 주택이 빠졌다. "집도 150% 상한이 있다" 가
    // 널리 퍼진 오해다.
    expect(BURDEN_CAP).toBe(1.5);
    expect(burdenCapApplies("house")).toBe(false);
    expect(burdenCapApplies("landAggregate")).toBe(true);
    expect(burdenCapApplies("building")).toBe(true);
  });

  it("주택은 대신 과세표준이 직전 연도의 105%로 묶인다", () => {
    expect(BASE_CAP_RATE).toBe(0.05);
  });
});

describe("근거가 rates 에 적혀 있다", () => {
  it("세율표마다 조문이 달려 있고 표에서 왔음을 밝힌다", () => {
    for (const k of ["house", "houseOneHome", "landAggregate", "landSeparate"] as const) {
      expect(r.propertyTax.rates[k].article, k).toMatch(/제111조/);
      expect(r.propertyTax.rates[k].article, k).toContain("(표)");
    }
  });

  it("아직 안 읽은 것을 스스로 적어 뒀다", () => {
    expect(r.notVerified.join(" ")).toMatch(/지역자원시설세/);
  });
});
