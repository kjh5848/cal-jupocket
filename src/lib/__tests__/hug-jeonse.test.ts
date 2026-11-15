import { describe, it, expect } from "vitest";
import r from "../../rates/hug-jeonse-2026.json";
import { hugGuarantee, hugSchedule, refusalChecks, REFUSAL_CHECKS } from "../hug-jeonse";
import { toDay, fromDay } from "../date-calc";

const d = (s: string) => toDay(s)!;

describe("요율 파일 — 조사 문서와 같은 값(2026-11-07 HUG·법령 확인)", () => {
  it("보증 조건", () => {
    expect(r.guarantee.depositCap).toEqual({ capital: 700_000_000, other: 500_000_000 });
    expect(r.guarantee.ltvLimitPct).toBe(90);
    expect(r.guarantee.seniorLimitPct).toBe(60);
    expect(r.guarantee.seniorLimitMultiFamilyPct).toBe(80);
    expect(r.guarantee.publicPriceMultiplierPct).toBe(140);
  });
  it("기한", () => {
    expect(r.deadlines.leaseReportDays).toBe(30);
    expect(r.deadlines.loanGuaranteeMonths).toBe(3);
    expect([r.deadlines.renewalNoticeFromMonths, r.deadlines.renewalNoticeToMonths]).toEqual([6, 2]);
  });
});

describe("보증 가능 여부 추산 — 손계산", () => {
  // 연립·다세대 공동주택가격 2억원 → 주택가격 2.8억원, 90% 선 2.52억원
  it("선순위 없음, 보증금 2.5억원 → 가능, 보증한도 2.52억원", () => {
    const x = hugGuarantee({ type: "row", capital: true, deposit: 250_000_000, senior: 0, basis: "public", price: 200_000_000 });
    expect(x.housePrice).toBe(280_000_000);
    expect(x.ltvLine).toBe(252_000_000);
    expect(x.ok).toBe(true);
    expect(x.guaranteeLimit).toBe(252_000_000);
  });
  it("근저당 5천만원이 있으면 2.5억 + 0.5억 > 2.52억 → 불가, 최대 보증금 2.02억원", () => {
    const x = hugGuarantee({ type: "row", capital: true, deposit: 250_000_000, senior: 50_000_000, basis: "public", price: 200_000_000 });
    expect(x.ltvOk).toBe(false);
    expect(x.ok).toBe(false);
    expect(x.maxDeposit).toBe(202_000_000);
  });
  it("선순위가 주택가격의 60%를 넘으면 불가", () => {
    const x = hugGuarantee({ type: "apartment", capital: true, deposit: 10_000_000, senior: 310_000_000, basis: "market", price: 500_000_000 });
    expect(x.seniorLine).toBe(300_000_000);
    expect(x.seniorOk).toBe(false);
    expect(x.maxDeposit).toBe(0);
  });
  it("다가구는 다른 세입자 보증금을 선순위에 더하고 80% 선을 쓴다", () => {
    const x = hugGuarantee({ type: "multi", capital: false, deposit: 100_000_000, senior: 200_000_000, otherDeposits: 300_000_000, basis: "public", price: 500_000_000 });
    expect(x.housePrice).toBe(700_000_000);
    expect(x.seniorTotal).toBe(500_000_000);
    expect(x.seniorLine).toBe(560_000_000);
    expect(x.seniorOk).toBe(true);
    expect(x.ltvOk).toBe(true); // 1억 + 5억 ≤ 6.3억
  });
  it("보증금 상한 — 수도권 7억, 그 외 5억", () => {
    const base = { type: "apartment" as const, deposit: 600_000_000, senior: 0, basis: "market" as const, price: 1_500_000_000 };
    expect(hugGuarantee({ ...base, capital: true }).depositOk).toBe(true);
    expect(hugGuarantee({ ...base, capital: false }).depositOk).toBe(false);
  });
});

describe("전세 일정", () => {
  const s = hugSchedule({ contract: d("2026-11-10"), start: d("2026-12-20"), moveIn: d("2026-12-20"), end: d("2028-12-19") });
  const at = (k: string) => fromDay(s.find((i) => i.key === k)!.day);
  it("날짜 순, 법정·HUG 기한", () => {
    expect(at("lease-report")).toBe("2026-12-10");
    expect(at("pre-limit")).toBe("2026-12-06");
    expect(at("loan-guarantee")).toBe("2027-03-20");
    expect(at("renewal-open")).toBe("2028-06-19");
    expect(at("renewal-deadline")).toBe("2028-10-19");
    expect(at("accident")).toBe("2029-01-19");
    expect(s.map((i) => i.day)).toEqual([...s.map((i) => i.day)].sort((a, b) => a - b));
  });
  it("계약일보다 앞선 기한은 뺀다(계약 직후 바로 시작하는 경우 사전한도심사)", () => {
    const t = hugSchedule({ contract: d("2026-12-15"), start: d("2026-12-20"), moveIn: d("2026-12-20"), end: d("2028-12-19") });
    expect(t.find((i) => i.key === "pre-limit")).toBeUndefined();
  });
});

describe("일정의 '하면 안 되는 것' — 순서 실수로 돈을 잃는 날", () => {
  const same = hugSchedule({ contract: d("2026-11-10"), start: d("2026-12-20"), moveIn: d("2026-12-20"), end: d("2028-12-19") });
  const late = hugSchedule({ contract: d("2026-11-10"), start: d("2026-12-20"), moveIn: d("2026-12-23"), end: d("2028-12-19") });
  const warn = (s: typeof same, k: string) => s.find((i) => i.key === k)?.warn ?? "";
  it("전입·만기·갱신거절·보증사고에 경고가 붙는다", () => {
    for (const k of ["move-in", "renewal-deadline", "end", "accident"]) expect(warn(same, k)).not.toBe("");
  });
  it("전입이 잔금일보다 늦으면 며칠 늦는지 말한다", () => {
    expect(warn(late, "move-in")).toContain("3일 늦어요");
    expect(warn(same, "move-in")).not.toContain("늦어요");
  });
  it("만기·보증사고 경고는 임차권등기 전 이사를 막는다", () => {
    expect(warn(same, "end")).toContain("임차권등기");
    expect(warn(same, "accident")).toContain("임차권등기");
  });
});

describe("숫자가 맞아도 가입이 안 되는 경우 — HUG 상품개요 가입 조건", () => {
  it("아파트는 위반건축물을, 단독·다가구는 전입세대확인서를 묻지 않는다", () => {
    expect(refusalChecks("apartment").map((c) => c.key)).not.toContain("violation");
    expect(refusalChecks("multi").map((c) => c.key)).not.toContain("others");
    expect(refusalChecks("row")).toHaveLength(REFUSAL_CHECKS.length);
  });
  it("계약기간 하한은 요율 파일 값", () => {
    expect(REFUSAL_CHECKS.find((c) => c.key === "contract")!.text).toContain(`${r.guarantee.minTermYears}년 미만`);
  });
  it("모든 항목에 확인할 곳과 근거가 있다", () => {
    for (const c of REFUSAL_CHECKS) expect(c.where && c.basis).toBeTruthy();
  });
});
