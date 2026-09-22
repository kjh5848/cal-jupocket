import { describe, it, expect } from "vitest";
import {
  weightedProfit,
  profitValue,
  assetValue,
  valuate,
  totalValue,
  profitWeight,
  assetWeight,
  realEstateHeavyProfitWeight,
  realEstateHeavyAssetWeight,
  floorPercent,
  capitalizationRatePercent,
  profitMultiple,
  premiumPercent,
  yearWeights,
  yearWeightDivisor,
  assetOnlyCases,
  premiumExclusions,
  committeeBand,
} from "../unlisted-stock";
import rates from "../../rates/unlisted-stock-2026.json";

describe("조문이 정한 상수 — rates 와 어긋나면 글이 틀린다", () => {
  it("가중치는 순손익 3 · 순자산 2 다 (시행령 제54조 제1항)", () => {
    expect(profitWeight).toBe(3);
    expect(assetWeight).toBe(2);
    expect(profitWeight + assetWeight).toBe(rates.weightedAverage.divisor);
  });

  it("부동산과다보유법인은 2 : 3 으로 뒤집힌다", () => {
    expect(realEstateHeavyProfitWeight).toBe(2);
    expect(realEstateHeavyAssetWeight).toBe(3);
    expect(realEstateHeavyProfitWeight).toBe(assetWeight);
    expect(realEstateHeavyAssetWeight).toBe(profitWeight);
  });

  it("하한은 순자산가치의 80% 다", () => {
    expect(floorPercent).toBe(80);
  });

  it("환원율은 연 10% — 시행규칙 제17조에서 온 값이다", () => {
    expect(capitalizationRatePercent).toBe(10);
    expect(rates.profitValue.capitalizationRateArticle).toContain("시행규칙 제17조");
  });

  it("환원율 10% 는 가중평균 순이익의 10배라는 뜻이다", () => {
    expect(profitMultiple).toBe(10);
  });

  it("최근 3년 가중치는 3 : 2 : 1, 나누는 수는 6 이다", () => {
    expect(yearWeights).toEqual([3, 2, 1]);
    expect(yearWeightDivisor).toBe(6);
    expect(yearWeights.reduce((a, b) => a + b, 0)).toBe(yearWeightDivisor);
  });

  it("최대주주 할증은 20% 다 (법 제63조 제3항)", () => {
    expect(premiumPercent).toBe(20);
  });

  it("평가심의위원회는 보충적 평가액의 70~130% 범위다", () => {
    expect(committeeBand).toEqual({ lower: 70, upper: 130 });
  });
});

describe("1주당 최근 3년간 순손익액의 가중평균액", () => {
  it("가까운 해가 무겁다 — 같은 합계라도 최근이 크면 값이 커진다", () => {
    const rising = weightedProfit([3000, 2000, 1000]);
    const falling = weightedProfit([1000, 2000, 3000]);
    expect(rising).toBeGreaterThan(falling);
  });

  it("조문의 식 그대로다 — {(1년전×3)+(2년전×2)+(3년전×1)} ÷ 6", () => {
    expect(weightedProfit([3000, 2000, 1000])).toBe(
      (3000 * 3 + 2000 * 2 + 1000 * 1) / 6,
    );
  });

  it("음수이면 0 으로 한다 — 적자라고 마이너스로 내려가지 않는다", () => {
    expect(weightedProfit([-5000, -3000, -1000])).toBe(0);
  });

  it("세 해가 모두 같으면 가중평균은 그 값과 같다", () => {
    expect(weightedProfit([1200, 1200, 1200])).toBe(1200);
  });
});

describe("순손익가치 — 환원율로 나눈다", () => {
  it("연 10% 로 나누는 것은 10 을 곱하는 것과 같다", () => {
    expect(profitValue([1000, 1000, 1000])).toBe(10000);
  });

  it("적자 법인의 순손익가치는 0 이다", () => {
    expect(profitValue([-1000, -2000, -3000])).toBe(0);
  });
});

describe("순자산가치", () => {
  it("순자산가액 ÷ 발행주식총수 다", () => {
    expect(assetValue(1_000_000_000, 10_000)).toBe(100_000);
  });

  it("순자산가액이 0 이하이면 0 원으로 한다 (시행령 제55조 제1항)", () => {
    expect(assetValue(-500_000_000, 10_000)).toBe(0);
  });

  it("발행주식총수가 0 이면 0 을 낸다 — 0 으로 나누지 않는다", () => {
    expect(assetValue(1_000_000_000, 0)).toBe(0);
  });
});

describe("valuate — 가중평균 → 하한 → 할증 순서", () => {
  const 흑자 = {
    perShareProfitByYear: [30_000, 24_000, 18_000] as [number, number, number],
    netAssets: 2_000_000_000,
    shares: 10_000,
  };

  it("순손익가치와 순자산가치를 3 : 2 로 섞는다", () => {
    const v = valuate(흑자);
    expect(v.profit).toBe(260_000); // {(30000*3)+(24000*2)+(18000*1)}/6 = 26,000 → ÷0.1
    expect(v.asset).toBe(200_000);
    expect(v.weighted).toBe(Math.floor((260_000 * 3 + 200_000 * 2) / 5));
    expect(v.weights).toEqual({ profit: 3, asset: 2 });
  });

  it("부동산과다보유법인은 순자산 쪽이 무거워 값이 달라진다", () => {
    const normal = valuate(흑자);
    const heavy = valuate({ ...흑자, realEstateHeavy: true });
    expect(heavy.weights).toEqual({ profit: 2, asset: 3 });
    // 순손익가치가 순자산가치보다 크므로 순자산 쪽이 무거워지면 값이 내려간다
    expect(heavy.weighted).toBeLessThan(normal.weighted);
  });

  it("가중평균이 순자산가치의 80% 보다 낮으면 그 80% 로 올린다", () => {
    const 적자 = valuate({
      perShareProfitByYear: [0, 0, 0],
      netAssets: 2_000_000_000,
      shares: 10_000,
    });
    expect(적자.asset).toBe(200_000);
    expect(적자.weighted).toBe(80_000); // (0*3 + 200,000*2)/5
    expect(적자.floor).toBe(160_000); // 200,000 × 80%
    expect(적자.floorApplied).toBe(true);
    expect(적자.base).toBe(160_000);
  });

  it("하한이 걸리지 않으면 가중평균이 그대로 간다", () => {
    const v = valuate(흑자);
    expect(v.floorApplied).toBe(false);
    expect(v.base).toBe(v.weighted);
  });

  it("순자산가치로만 평가하면 하한도 가중평균도 거치지 않는다", () => {
    const v = valuate({ ...흑자, assetOnly: true });
    expect(v.base).toBe(v.asset);
    expect(v.floorApplied).toBe(false);
  });

  it("최대주주 할증은 하한을 적용한 뒤의 가액에 붙는다", () => {
    const 적자최대주주 = valuate({
      perShareProfitByYear: [0, 0, 0],
      netAssets: 2_000_000_000,
      shares: 10_000,
      majorShareholder: true,
    });
    expect(적자최대주주.base).toBe(160_000);
    expect(적자최대주주.premium).toBe(32_000); // 160,000 × 20%
    expect(적자최대주주.perShare).toBe(192_000);
  });

  it("최대주주가 아니면 할증이 0 이다", () => {
    const v = valuate(흑자);
    expect(v.premium).toBe(0);
    expect(v.perShare).toBe(v.base);
  });

  it("할증은 평가액을 정확히 1.2 배로 만든다", () => {
    const plain = valuate(흑자);
    const major = valuate({ ...흑자, majorShareholder: true });
    expect(major.perShare).toBe(plain.base + Math.floor((plain.base * 20) / 100));
  });
});

describe("총 평가액", () => {
  it("1주당 가액 × 주식 수다", () => {
    const v = valuate({
      perShareProfitByYear: [30_000, 24_000, 18_000],
      netAssets: 2_000_000_000,
      shares: 10_000,
    });
    expect(totalValue(v, 3_000)).toBe(v.perShare * 3_000);
  });
});

describe("조문 목록이 rates 에서 그대로 온다", () => {
  it("순자산가치 전용 사유에 삭제된 제4호가 없다", () => {
    const hos = assetOnlyCases.map((c) => c.ho);
    expect(hos).not.toContain(4);
    expect(hos).toEqual([1, 2, 3, 5, 6]);
  });

  it("할증 제외에 중소기업이 들어 있다 — 이 글의 반전", () => {
    const labels = premiumExclusions.map((e) => e.label).join(" ");
    expect(labels).toContain("중소기업");
    expect(labels).toContain("중견기업");
    expect(labels).toContain("결손금");
  });

  it("검증하지 못한 것을 rates 가 스스로 적어 둔다", () => {
    expect(rates.notVerified.length).toBeGreaterThan(0);
    expect(rates.notVerified.join(" ")).toContain("양도소득세");
  });

  it("verifiedOn 과 lawVersion 이 있다", () => {
    expect(rates.verifiedOn).toBe("2026-09-22");
    expect(rates.lawVersion).toContain("시행규칙");
  });
});
