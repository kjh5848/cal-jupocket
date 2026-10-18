/**
 * 대출이자 계산 시리즈 — 2026-10-18 도구 담기 루틴(roberin #25 대출계산기). 돈·금융 클러스터 첫 시리즈(설계 3-4 신설).
 * 자동완성(keywords/ac-loan-2026-10-18.csv): 대출이자 계산기 · 대출이자 계산방법·계산법 · 1억 대출 이자 4%·5% · 2억·3억 대출 이자 계산 ·
 * 주택담보대출·전세대출·신용대출 이자계산기 · 체증식 대출이자계산기.
 * 근거: 법령 숫자 없음 — 상환 방식 공식(rates: loan-2026.json)
 *
 * 대출이자 계산 방법·계산법·공식·1억 이자 → 허브 / 원리금균등 원금균등·만기일시 → 상환 방식 / 대출이자 계산기 → 계산기
 * 쓰지 않은 축: 체증식(정의가 상품마다 다름), 중도상환수수료(#30). 마이너스통장(#26 일할 이자)은 minus-account 시리즈
 */
import type { Series } from "./types";

export const loanSeries: Series = {
  id: "loan",
  cluster: "money",
  hub: { slug: "loan-interest", keyword: "대출이자 계산", label: "대출이자 계산 — 방법·공식" },
  items: [
    { slug: "loan-repayment-methods", keyword: "원리금균등 원금균등", label: "원리금균등 원금균등 차이" },
    { slug: "loan-calculator", keyword: "대출 이자 계산기", label: "대출 이자 계산기" },
  ],
};
