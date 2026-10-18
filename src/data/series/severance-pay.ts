/**
 * 퇴직금 계산 시리즈 — 2026-10-18 도구 담기 루틴(roberin #23 퇴직금계산기).
 * v54 검색량 1순위: 퇴직금계산기 291,300(입찰가 ₩17 — 클릭 수익은 낮지만 노동 head). 퇴직금 18,700.
 * 근거: 근로자퇴직급여 보장법 제3조·제4조 제1항·제8조 제1항·제9조, 근로기준법 제2조 제1항 제6호·제2항,
 * 고용노동부 퇴직금 계산 안내(재직일수/365·상여 3/12·퇴직일). rates: severance-2026.json pay
 *
 * 퇴직금·퇴직금 계산 방법·평균임금 → 허브 / 퇴직금 조건·1년·주 15시간·5인 미만·알바 → 조건 / 퇴직금 계산기 → 계산기
 * 쓰지 않은 축: 평균임금에서 빼는 기간(시행령 제2조 — 다음 회차 후보), DB·DC형 퇴직연금 지급액(퇴직연금 시리즈 몫)
 */
import type { Series } from "./types";

export const severancePaySeries: Series = {
  id: "severance-pay",
  cluster: "labor",
  hub: { slug: "severance-pay", keyword: "퇴직금", label: "퇴직금 — 계산 방법·평균임금" },
  items: [
    { slug: "severance-pay-criteria", keyword: "퇴직금 조건", label: "퇴직금 조건 — 1년·주 15시간" },
    { slug: "severance-pay-calculator", keyword: "퇴직금 계산기", label: "퇴직금 계산기" },
  ],
};
