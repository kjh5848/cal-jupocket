/**
 * 4대보험 시리즈 — 2026-10-13. keywords/today-100-2026-10-13.csv 의 4대보험·건강보험료 8개를 전부 쓰고,
 * 자동완성(keywords/four-insurance.csv, 약 165개)에서 장기요양보험료·고용보험료를 더했다.
 * 근거: 국민연금법 제88조·부칙 <법률 제20903호> 제4조·시행령 제2조, 국민건강보험법 제6조·제44조·제69조·제73조·제76조·
 * 제78조·제86조·제91조·시행령 제9조·제32조·제44조, 노인장기요양보험법 제8조·제9조·시행령 제4조, 보험료징수법 제13조·
 * 시행령 제12조, 고용보험법 시행령 제3조. rates: four-insurance-2026.json
 *
 * 4대보험·종류·몇프로·세금 → 허브 / 4대보험 계산기(월급·급여·실수령액·2026) → 계산기
 * 4대보험 요율(2026·2027·요율표·합계·인상) → 요율 / 건강보험료·계산·직장가입자·산정기준·상한액 → 건강보험료 계산
 * 지역건강보험료·지역가입자 계산 → 지역 / 장기요양보험료 → 장기요양 / 고용보험료 → 고용
 * 4대보험 가입조건(주15시간·5인미만·알바·시간) → 가입조건 / 일용직 4대보험(8일·가입기준·공제) → 일용직
 * 건강보험 환급금(조회·신청·기간·지급일·이자) → 환급금
 * 쓰지 않은 축: 가입증명서·자격득실확인서 발급(서식·화면), 4대보험 연계센터(사이트 안내), 산재보험료율(업종별 고시),
 * 건강보험료 상한액 금액(고시 — 이 파일에서 확인 못 함)
 */
import type { Series } from "./types";

export const fourInsuranceSeries: Series = {
  id: "four-insurance",
  cluster: "retirement",
  hub: { slug: "four-insurance", keyword: "4대보험", label: "4대보험" },
  items: [
    { slug: "four-insurance-calculator", keyword: "4대보험 계산기", label: "4대보험 계산기" },
    { slug: "four-insurance-rate", keyword: "4대보험 요율", label: "4대보험 요율" },
    { slug: "health-insurance-premium", keyword: "건강보험료 계산", label: "건강보험료 계산" },
    { slug: "regional-health-insurance", keyword: "지역건강보험료 계산", label: "지역건강보험료 계산" },
    { slug: "long-term-care-premium", keyword: "장기요양보험료", label: "장기요양보험료" },
    { slug: "employment-insurance-premium", keyword: "고용보험료", label: "고용보험료" },
    { slug: "four-insurance-eligibility", keyword: "4대보험 가입조건", label: "4대보험 가입조건" },
    { slug: "daily-worker-insurance", keyword: "일용직 4대보험", label: "일용직 4대보험" },
    { slug: "health-insurance-refund", keyword: "건강보험 환급금", label: "건강보험 환급금" },
  ],
};
