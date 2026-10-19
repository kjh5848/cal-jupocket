/** 리브랜딩 Task 5 — 초성·동의어 도구 검색(설계 5절). 사람들이 실제로 치는 말을 표로 고정한다. */
import { describe, it, expect } from "vitest";
import { tools } from "../../data/tools";
import { toChoseong, normalize, searchTools } from "../search";

const first = (q: string) => searchTools(tools, q)[0]?.tool.href;

describe("기본 함수", () => {
  it("초성", () => {
    expect(toChoseong("실수령액")).toBe("ㅅㅅㄹㅇ");
    expect(toChoseong("3.3% 계산기")).toBe("3.3% ㄱㅅㄱ");
  });
  it("정규화 — 공백·대소문자·전각", () => {
    expect(normalize("  IRP  세액공제 ")).toBe("irp세액공제");
    expect(normalize("３．３")).toBe("3.3");
  });
});

const CASES: [string, string][] = [
  ["ㅅㅅㄹㅇ", "/guide/take-home-calculator/"],
  ["실수령", "/guide/take-home-calculator/"],
  ["월급 얼마", "/guide/take-home-calculator/"],
  ["세후 월급", "/guide/take-home-calculator/"],
  ["3.3", "/freelancer-33/"],
  [" 3.3 ", "/freelancer-33/"],
  ["8.8", "/withholding/"],
  ["부가세", "/vat/"],
  ["퍼센트", "/tools/percent/"],
  ["퍼센트계산기", "/tools/percent/"],
  ["할인율 계산", "/tools/percent/"],
  ["증감률", "/tools/percent/"],
  ["ㅍㅅㅌ", "/tools/percent/"],
  ["날짜계산기", "/tools/date-diff/"],
  ["날짜 계산", "/tools/date-diff/"],
  ["업무일 계산", "/tools/date-diff/"],
  ["며칠", "/tools/date-diff/"],
  ["ㄴㅉㄱㅅㄱ", "/tools/date-diff/"],
  ["디데이", "/tools/dday/"],
  ["디데이계산기", "/tools/dday/"],
  ["D-day", "/tools/dday/"],
  ["ㄷㄷㅇ", "/tools/dday/"],
  ["만나이계산기", "/tools/age/"],
  ["만 나이", "/tools/age/"],
  ["만 나이 계산", "/tools/age/"],
  ["ㅁㄴㅇ", "/tools/age/"],
  ["평수계산기", "/tools/pyeong/"],
  ["평수 계산", "/tools/pyeong/"],
  ["제곱미터 평", "/tools/pyeong/"],
  ["ㅍㅅㄱㅅㄱ", "/tools/pyeong/"],
  ["요일 계산기", "/tools/date-day/"],
  ["무슨 요일", "/tools/date-day/"],
  ["몇주차", "/tools/date-day/"],
  ["ㅇㅇㄱㅅㄱ", "/tools/date-day/"],
  ["커플 기념일", "/tools/anniversary/"],
  ["100일 계산기", "/tools/anniversary/"],
  ["결혼기념일 계산기", "/tools/anniversary/"],
  ["ㅋㅍㄱㄴㅇ", "/tools/anniversary/"],
  ["생일 디데이", "/tools/birthday-dday/"],
  ["생일까지 며칠", "/tools/birthday-dday/"],
  ["윤년 생일", "/tools/birthday-dday/"],
  ["ㅅㅇㄷㄷㅇ", "/tools/birthday-dday/"],
  ["디데이", "/tools/dday/"],
  ["복리계산기", "/tools/compound/"],
  ["적립식 복리", "/tools/compound/"],
  ["주식복리계산기", "/tools/compound/"],
  ["파킹통장 이자 계산기", "/guide/parking-account-interest-calculator/"],
  ["파킹통장", "/guide/parking-account-interest-calculator/"],
  ["ㅍㅋㅌㅈ", "/guide/parking-account-interest-calculator/"],
  ["부가가치세", "/vat/"],
  ["ㅂㄱㅅ", "/vat/"],
  ["종소세", "/income-tax-refund/"],
  ["가산세", "/penalty/"],
  ["국민연금", "/national-pension-premium/"],
  ["주휴", "/guide/weekly-holiday-pay-calculator/"],
  ["연차", "/guide/annual-leave-calculator/"],
  ["실업급여", "/guide/unemployment-benefit-calculator/"],
  ["구직급여", "/guide/unemployment-benefit-calculator/"],
  ["최저시급", "/guide/minimum-wage-calculator/"],
  ["재산세", "/property-tax/"],
  ["자동차세", "/vehicle-tax/"],
  ["취득세", "/acquisition-tax/"],
  ["상속세", "/inheritance/"],
  ["증여세", "/guide/gift-tax-calculator/"],
  ["양도세", "/guide/capital-gains-calculator/"],
  ["종부세", "/guide/jongbu-calculator/"],
  ["로또", "/guide/lotto-tax-calculator/"],
  ["사대보험", "/guide/four-insurance-calculator/"],
  ["irp", "/guide/irp-tax-credit-calculator/"],
  ["연말정산", "/guide/year-end-calculator/"],
  ["차용증", "/guide/family-loan-interest/"],
  ["산재", "/guide/industrial-accident-leave-pay/"],
];

describe("검색 결과 1위", () => {
  for (const [q, href] of CASES) it(q, () => expect(first(q)).toBe(href));
});

describe("이상한 입력", () => {
  it("자모·완성형 섞임", () => {
    expect(searchTools(tools, "ㅅㅅ령").length).toBeGreaterThan(0);
    expect(searchTools(tools, "ㅅㅅ 령")[0].tool.href).toBe("/guide/take-home-calculator/");
  });
  it("빈 값·공백만 → 빈 배열", () => {
    expect(searchTools(tools, "")).toEqual([]);
    expect(searchTools(tools, "   ")).toEqual([]);
  });
  it("없는 말 → 빈 배열(예외 없음)", () => {
    expect(searchTools(tools, "PDF")).toEqual([]);
    expect(searchTools(tools, "ㅎㅎㅎㅎㅎㅎ")).toEqual([]);
  });
  it("곧 담길 도구는 공개 도구 뒤", () => {
    // 날짜 요일 계산기가 공개돼(2026-10-19) "날짜" 로는 곧 담길 도구가 안 걸린다 — 디데이 계산기(공개)와 수능 디데이(곧)가 같이 걸리는 "디데이"
    const r = searchTools(tools, "디데이");
    const firstNext = r.findIndex((x) => x.tool.status === "next");
    expect(firstNext).toBeGreaterThan(-1);
    expect(r.slice(firstNext).every((x) => x.tool.status === "next")).toBe(true);
  });
  it("이름 안 일치 구간(칠하기)", () => {
    const r = searchTools(tools, "실수령")[0];
    const [a, b] = r.ranges[0];
    expect(r.tool.name.slice(a, b)).toBe("실수령");
    const c = searchTools(tools, "ㅅㅅㄹㅇ")[0];
    expect(c.tool.name.slice(...c.ranges[0])).toBe("실수령액");
  });
  it("최대 8개", () => {
    expect(searchTools(tools, "계산기").length).toBeLessThanOrEqual(8);
  });
});
