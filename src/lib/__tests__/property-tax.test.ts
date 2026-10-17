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

/*
 * 계산기 화면(housePage) — roberin #18 과 같은 입력 11개를 넣어 대조했다(2026-10-18).
 * roberin 은 공정시장가액비율을 손으로 넣는 칸(기본 60%)이라 1세대 1주택은 43·44·45% 를 직접 넣어 맞췄다.
 * 10개 1원까지 같고, 333,333,333원 1주택만 roberin 이 본세 원 미만을 반올림해 1원 크다(단수 원문 미확인 — 보류).
 * 아래 값은 조문(시행령 제109조 ① 2호·법 제111조의2·제112조·제151조 ① 6호)으로 손계산한 값이다.
 */
import { housePage } from "../property-tax";

describe("housePage — 계산기 화면", () => {
  it.each([
    // [시가표준액, 1주택, 도시지역분, 본세, 도시지역분, 지방교육세, 합계]
    [1 * 억, true, true, 21_500, 60_200, 4_300, 86_000],
    [3 * 억, true, true, 99_000, 180_600, 19_800, 299_400],
    [5 * 억, true, true, 260_000, 308_000, 52_000, 620_000],
    [9 * 억, true, true, 787_500, 567_000, 157_500, 1_512_000],
    [15 * 억, true, false, 1_732_500, 0, 346_500, 2_079_000],
    [1 * 억, false, true, 60_000, 84_000, 12_000, 156_000],
    [5 * 억, false, false, 570_000, 0, 114_000, 684_000],
    [15 * 억, false, true, 2_970_000, 1_260_000, 594_000, 4_824_000],
    [333_333_333, true, true, 116_666, 205_333, 23_333, 345_332],
  ])("%d원 1주택=%s 도시=%s", (v, one, urban, pt, urb, edu, total) => {
    const p = housePage({ standardValue: v, oneHome: one, urban });
    expect([p.propertyTax, p.urbanArea, p.educationTax, p.total]).toEqual([pt, urb, edu, total]);
    expect(p.half).toBe(Math.floor(total / 2));
  });

  it("1세대 1주택 특례로 줄어드는 돈은 체크와 상관없이 같다", () => {
    // 5억 도시지역분 포함: 그 밖의 주택 570,000 + 420,000 + 114,000 = 1,104,000 − 특례 620,000
    const on = housePage({ standardValue: 5 * 억, oneHome: true, urban: true });
    const off = housePage({ standardValue: 5 * 억, oneHome: false, urban: true });
    expect(on.generalTotal).toBe(1_104_000);
    expect(on.oneHomeSaving).toBe(484_000);
    expect(off.oneHomeSaving).toBe(484_000);
    expect(off.total).toBe(off.generalTotal);
  });

  it("실효세율 = 합계 ÷ 시가표준액", () => {
    expect(housePage({ standardValue: 5 * 억, oneHome: true, urban: true }).effective).toBeCloseTo(620_000 / (5 * 억), 12);
    expect(housePage({ standardValue: 0 }).effective).toBe(0);
  });

  it("본세 20만원 이하면 7월 한 번에 올 수 있다(제115조 ① 3호 단서), 2천원 미만은 징수 안 함(제119조)", () => {
    expect(housePage({ standardValue: 5 * 억, oneHome: true }).lumpSum).toBe(false); // 본세 260,000
    expect(housePage({ standardValue: 3 * 억, oneHome: true }).lumpSum).toBe(true); // 본세 99,000
    const tiny = housePage({ standardValue: 3_000_000, oneHome: true });
    expect(tiny.collected).toBe(false);
    expect(tiny.lumpSum).toBe(false);
  });

  it("원 미만 버림이 정수 연산과 같다 — 1만원 단위 0~30억, 1주택·그 밖의 주택", () => {
    const R1 = [[300_000_000n, 43n], [600_000_000n, 44n], [null, 45n]] as const;
    const HB = [[60_000_000n, 5n, 0n], [150_000_000n, 10n, 30_000n], [300_000_000n, 20n, 120_000n], [null, 35n, 420_000n]] as const;
    const GB = [[60_000_000n, 10n, 0n], [150_000_000n, 15n, 60_000n], [300_000_000n, 25n, 195_000n], [null, 40n, 570_000n]] as const;
    const prog = (base: bigint, br: readonly (readonly [bigint | null, bigint, bigint])[]) => {
      let prev = 0n;
      for (const [up, rate, b] of br) {
        if (up === null || base <= up) return b + ((base - prev) * rate) / 10_000n;
        prev = up;
      }
      return 0n;
    };
    let bad = 0;
    for (let v = 10_000; v <= 3_000_000_000; v += 10_000) {
      for (const one of [true, false]) {
        const V = BigInt(v);
        const ratio = one ? R1.find(([u]) => u === null || V <= u)![1] : 60n;
        const base = (V * ratio) / 100n;
        const pt = prog(base, one ? HB : GB);
        const p = housePage({ standardValue: v, oneHome: one, urban: true });
        if (BigInt(p.base) !== base || BigInt(p.propertyTax) !== pt || BigInt(p.urbanArea) !== (base * 14n) / 10_000n || BigInt(p.educationTax) !== (pt * 2n) / 10n) bad++;
      }
    }
    expect(bad).toBe(0);
  });
});
