/**
 * 연말정산 — 일정과 절차만 본다.
 *
 * 이 글은 공제 항목을 나열하지 않는다. 그 숫자는 deduction-2026.json 과
 * pension-account-2026.json 에 있고, 여기 또 적으면 두 곳이 어긋난다.
 * 그래서 이 테스트는 **rates 가 제 범위를 지키는지**도 본다.
 */
import { describe, it, expect } from "vitest";
import r from "../../rates/year-end-2026.json";

describe("일정 — 소득세법 제137조·제140조", () => {
  it("정산은 다음 해 2월분 급여를 줄 때다", () => {
    expect(r.settlement.when).toContain("2월");
    expect(r.settlement.article).toContain("제137조");
  });

  it("퇴사자는 2월을 기다리지 않는다", () => {
    expect(r.settlement.retiree).toContain("퇴직하는 달");
  });

  it("2월 급여가 없으면 2월 말일로 본다", () => {
    expect(r.settlement.whenIfUnpaid).toContain("2월 말일");
  });

  it("공제신고서 기한은 그 2월 급여를 받기 전이다", () => {
    expect(r.declarationDeadline.when).toContain("받기 전");
    expect(r.declarationDeadline.article).toContain("제140조");
  });

  it("일용근로자는 제외된다", () => {
    expect(r.declarationDeadline.dailyWorkerExcluded).toBe(true);
  });
});

describe("서류를 안 내면", () => {
  it("본인 기본공제와 표준세액공제만 적용된다 — 제137조 제3항", () => {
    expect(r.noFilingPenalty.applied).toContain("본인");
    expect(r.noFilingPenalty.applied).toContain("표준세액공제");
    expect(r.noFilingPenalty.article).toContain("제137조");
  });
});

describe("추가 납부 분할 — 제137조 제4항", () => {
  it("10만원을 넘으면 2~4월에 나눠 뗄 수 있다", () => {
    expect(r.installment.over).toBe(100_000);
    expect(r.installment.months).toContain("4월");
  });

  it('"할 수 있다" 라는 것을 적어 뒀다 — 회사가 정한다', () => {
    expect(r.installment.note).toContain("할 수 있다");
  });
});

describe("지급시기 의제 — 제135조", () => {
  it("1~11월분은 12월 31일, 12월분은 다음 해 2월 말일", () => {
    expect(r.deemedPayment.janToNov).toContain("12월 31일");
    expect(r.deemedPayment.december).toContain("2월 말일");
  });
});

describe("범위를 지킨다", () => {
  it("공제 항목별 금액을 여기 적지 않는다", () => {
    // 두 곳에 같은 숫자가 있으면 한 곳만 고치게 된다.
    const s = JSON.stringify(r);
    expect(s).not.toMatch(/insuranceLimit|medicalRate|creditCard/);
    expect(r.notVerified.join(" ")).toMatch(/공제 항목별/);
  });

  it("확인 못 한 것을 스스로 적어 뒀다", () => {
    const s = r.notVerified.join(" ");
    expect(s).toMatch(/간이세액표/);
    expect(s).toMatch(/부칙/);
  });

  it("빈칸이던 표준세액공제와 경정청구는 2026-10-13 원문으로 채웠다", () => {
    // 이 테스트의 앞 버전은 둘을 '확인 못 함' 목록에 두라고 지켰다. 원문을 읽고 채웠으므로
    // 지우지 않고 확인된 값을 고정하는 쪽으로 바꿨다.
    expect(r.calc.standardTaxCredit.amount).toBe(130_000);
    expect(r.calc.standardTaxCredit.article).toContain("제59조의4 제9항");
    expect(r.correction.years).toBe(5);
    expect(r.correction.rule).toContain("연말정산세액의 납부기한이 지난 후");
  });

  it("자녀세액공제 부칙은 2026-10-13 원문(법률 제21548호)으로 채웠다", () => {
    const k = r.calc.childTaxCredit;
    expect(k.buchik.law).toContain("제21548호");
    expect(k.buchik.ageByYear["2026"]).toBe(9);
    expect(k.buchik.excludedBirthYear).toBe(2017);
    expect(k.age).toBe(13);
    expect(r.notVerified.join(" ")).not.toMatch(/자녀세액공제\(2026/);
  });
});
