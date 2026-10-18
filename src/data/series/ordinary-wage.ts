/**
 * 통상임금 시리즈 — 2026-10-18 도구 담기 루틴(roberin #4 대한민국 통상임금 계산기). 급여·근로 클러스터, 야근수당·시급 시리즈와 이어진다.
 * 자동완성(keywords/ac-ordinary-wage-2026-10-18.csv): 통상임금(계산·계산기·계산 방법·계산법·계산 엑셀·기준·뜻·이란) · 통상시급(계산·계산 방법·계산기·기본급 차이·기본시급·뜻·주휴수당·최저시급) ·
 * 1일 통상임금(계산기) · 육아휴직 통상임금 · 퇴직금 통상임금 · 평균임금 통상임금. 금액 줄기 없음 → 프리셋 없음.
 * 근거: 근로기준법 시행령 제6조 ①②③ — rates: ordinary-wage-2026.json
 *
 * 통상임금·뜻·기준·계산 방법 → 허브 / 통상시급·기본시급 차이·주휴·최저시급 → 통상시급 / 통상임금 계산기·1일 통상임금 계산기 → 계산기
 * 쓰지 않은 축: 어떤 수당이 들어가는지(판례·지침 원문 미확인), 평균임금과 비교(근로기준법 제2조 ② — 이번에 열지 않음), 퇴직금(평균임금 기준, 퇴직금 시리즈)
 */
import type { Series } from "./types";

export const ordinaryWageSeries: Series = {
  id: "ordinary-wage",
  cluster: "labor",
  hub: { slug: "ordinary-wage", keyword: "통상임금", label: "통상임금 — 뜻과 시간급 계산" },
  items: [
    { slug: "ordinary-hourly-wage", keyword: "통상시급", label: "통상시급 — 월급 ÷ 209시간" },
    { slug: "ordinary-wage-calculator", keyword: "통상임금 계산기", label: "통상임금 계산기" },
  ],
};
