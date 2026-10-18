/**
 * 시급 계산 시리즈 — 2026-10-18 도구 담기 루틴(roberin #11 시급계산기). 급여·근로 클러스터, 최저임금·주휴수당 시리즈와 이어진다.
 * 검색량(keyword-research.md v54): 시급계산기 145,600~186,800. 자동완성(keywords/ac-hourly-wage-2026-10-18.csv): 시급 계산기 · 시급 월급 계산기 ·
 * 2026·2027 최저시급 월급(세후) · 시급계산기 주휴수당 · 알바 시급 계산기(일급·세후·3.3·4대보험) · 월급 시급 계산기 · 연봉 시급 계산기 · 야간시급계산기 · 통상시급 계산.
 * 근거: 근로기준법 제18조 ③·제50조·제55조, 시행령 별표 2, 최저임금법 시행령 제5조, 2026·2027 최저임금 고시 — rates: labor-2026.json
 *
 * 시급 계산·알바 시급 계산 → 허브 / 시급 월급·최저시급 월급·월급 시급 → 월급 환산 / 시급 계산기·주휴수당 포함 → 계산기
 * 쓰지 않은 축: 야간시급(연장·야간·휴일 가산, 근로기준법 제56조 — #14 야근수당 계산기 회차), 통상시급(#4 통상임금 회차),
 * 세후(3.3%·4대보험은 기존 계산기로 링크만), 알바 어플(상품)
 */
import type { Series } from "./types";

export const hourlyWageSeries: Series = {
  id: "hourly-wage",
  cluster: "labor",
  hub: { slug: "hourly-wage", keyword: "시급 계산", label: "시급 계산 — 일급·주급·월급" },
  items: [
    { slug: "hourly-wage-monthly", keyword: "시급 월급", label: "시급 월급 환산 — 209시간" },
    { slug: "hourly-wage-calculator", keyword: "시급 계산기", label: "시급 계산기" },
  ],
};
