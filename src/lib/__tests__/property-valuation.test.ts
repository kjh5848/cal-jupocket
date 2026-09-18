import { describe, it, expect } from "vitest";
import {
  giftValuationWindow,
  supplementaryBasis,
  requiredAppraisalCount,
  giftPeriodMonths,
  inheritancePeriodMonths,
} from "../property-valuation";
import rates from "../../rates/property-valuation-2026.json";
import gift from "../../rates/gift-2026.json";

describe("평가기간 — 증여와 상속이 다르다", () => {
  it("증여는 전 6개월·후 3개월이다 (시행령 제49조 제1항)", () => {
    expect(giftPeriodMonths.before).toBe(6);
    expect(giftPeriodMonths.after).toBe(3);
  });

  it("상속은 전후 6개월로 대칭이다", () => {
    expect(inheritancePeriodMonths.before).toBe(6);
    expect(inheritancePeriodMonths.after).toBe(6);
  });

  it("증여의 창은 상속의 창과 같지 않다 — 이 글의 척추", () => {
    expect(giftPeriodMonths.after).not.toBe(inheritancePeriodMonths.after);
  });
});

describe("giftValuationWindow", () => {
  it("평가기간을 증여일 기준으로 앞 6개월·뒤 3개월로 잡는다", () => {
    const w = giftValuationWindow("2026-09-18");
    expect(w.valuationDate).toBe("2026-09-18");
    expect(w.periodFrom).toBe("2026-03-18");
    expect(w.periodTo).toBe("2026-12-18");
  });

  it("신고기한은 증여일이 아니라 그 달 말일부터 3개월이다 (법 제68조 제1항)", () => {
    // 2026-09-18 증여 → 말일 2026-09-30 → 3개월 → 2026-12-31
    expect(giftValuationWindow("2026-09-18").filingDeadline).toBe("2026-12-31");
    // 같은 달이면 1일에 받아도 말일에 받아도 기한이 같다
    expect(giftValuationWindow("2026-09-01").filingDeadline).toBe("2026-12-31");
    expect(giftValuationWindow("2026-09-30").filingDeadline).toBe("2026-12-31");
  });

  it("신고기한은 rates 의 개월 수(gift-2026.json)를 쓴다", () => {
    expect(gift.deadline.months).toBe(3);
  });

  it("말일 보정을 한다 — 2월로 넘어가도 없는 날짜를 만들지 않는다", () => {
    // 2025-11-30 증여 → 말일 2025-11-30 → 3개월 → 2026-02-28
    expect(giftValuationWindow("2025-11-30").filingDeadline).toBe("2026-02-28");
  });

  it("평가심의위원회 신청기한은 신고기한 만료 70일 전이다", () => {
    const w = giftValuationWindow("2026-09-18");
    expect(rates.valuationCommittee.giftRequestDaysBeforeDeadline).toBe(70);
    const diff =
      (Date.parse(w.filingDeadline) - Date.parse(w.committeeRequestBy)) / 86400000;
    expect(diff).toBe(70);
  });

  it("소급 기산일은 평가기준일 전 2년이다", () => {
    expect(giftValuationWindow("2026-09-18").lookBackFrom).toBe("2024-09-18");
    expect(rates.valuationPeriod.outsideWindow.priorYears).toBe(2);
  });

  it("연말을 넘겨도 연도가 맞는다", () => {
    const w = giftValuationWindow("2026-12-10");
    expect(w.periodFrom).toBe("2026-06-10");
    expect(w.periodTo).toBe("2027-03-10");
    expect(w.filingDeadline).toBe("2027-03-31");
  });

  it("읽을 수 없는 날짜는 던진다", () => {
    expect(() => giftValuationWindow("어제")).toThrow();
  });
});

describe("보충적 평가 — 종류마다 근거가 다르다 (법 제61조 제1항)", () => {
  it("네 종류가 모두 있다", () => {
    for (const k of ["land", "building", "officetel", "house"]) {
      expect(supplementaryBasis(k)).toBeTruthy();
    }
  });

  it("토지는 개별공시지가, 주택은 고시주택가격이다", () => {
    expect(supplementaryBasis("land")!.basis).toContain("개별공시지가");
    expect(supplementaryBasis("house")!.basis).toContain("공동주택가격");
  });

  it("오피스텔·상업용 건물은 토지와 건물을 일괄 고시한다", () => {
    expect(supplementaryBasis("officetel")!.basis).toContain("일괄");
  });

  it("없는 종류는 undefined 다 — 임의로 채우지 않는다", () => {
    expect(supplementaryBasis("비상장주식")).toBeUndefined();
  });
});

describe("감정기관 수 (법 제60조 제5항, 시행령 제49조 제6항)", () => {
  it("기준시가 10억원 이하면 한 곳으로 된다", () => {
    expect(rates.appraisalAgencies.reducedThreshold).toBe(1_000_000_000);
    expect(requiredAppraisalCount(900_000_000)).toBe(1);
    expect(requiredAppraisalCount(1_000_000_000)).toBe(1);
  });

  it("10억원을 넘으면 둘 이상이다", () => {
    expect(requiredAppraisalCount(1_000_000_001)).toBe(2);
    expect(requiredAppraisalCount(3_000_000_000)).toBe(2);
  });
});

describe("rates 파일 자체", () => {
  it("확인일과 법령 버전이 적혀 있다", () => {
    expect(rates.verifiedOn).toBe("2026-09-18");
    expect(rates.lawVersion).toContain("상속세 및 증여세법");
    expect(rates.lawVersion).toContain("시행령");
  });

  it("출처가 전부 법령 원문이다 — 재가공본을 쓰지 않았다", () => {
    expect(rates.sources.length).toBeGreaterThanOrEqual(3);
    for (const s of rates.sources) expect(s.url).toContain("law.go.kr");
  });

  it("시가로 인정되는 것 세 가지가 판단 기준일과 함께 있다", () => {
    expect(rates.marketValueKinds).toHaveLength(3);
    for (const k of rates.marketValueKinds) {
      expect(k.basisDate.length).toBeGreaterThan(0);
      expect(k.article).toContain("제49조");
    }
  });

  it("안 본 것을 안 봤다고 적어 뒀다", () => {
    expect(rates.notVerified.length).toBeGreaterThan(0);
    expect(rates.notVerified.join(" ")).toContain("부담부증여");
  });
});
