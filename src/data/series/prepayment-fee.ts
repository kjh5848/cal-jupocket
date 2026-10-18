/**
 * 중도상환수수료 시리즈 — 2026-10-19 도구 담기 루틴(roberin #30 중도상환수수료 계산기). 돈·금융 클러스터 다섯 번째 시리즈.
 * 자동완성(keywords/ac-prepayment-fee-2026-10-19.csv): 중도상환수수료 계산·계산 방법·계산방법 · 중도상환수수료 3년·3년 이후·면제 기간·면제시점 도래 ·
 * 중도상환수수료 계산기·대출 중도상환 계산기 · 주택담보대출·신용대출·전세대출 중도상환수수료.
 * 근거: 금융소비자보호법 제20조 ① 4호 나목 1)(계약 성립일부터 3년) · 산식은 은행 상품 안내 문구(rates: prepayment-fee-2026.json)
 *
 * 계산·계산 방법 → 허브 / 3년·3년 이후·면제 기간 → 3년 / 계산기 → 계산기
 * 쓰지 않은 축: 은행별 수수료율 비교·면제 은행(상품 조건 — 원문으로 닫히지 않음), 디딤돌·보금자리론(주택도시기금·주금공 상품 조건 원문 미확인), 주담대 10%(해마다 일부 상환 면제 — 약정마다 다름)
 */
import type { Series } from "./types";

export const prepaymentFeeSeries: Series = {
  id: "prepayment-fee",
  cluster: "money",
  hub: { slug: "prepayment-fee", keyword: "중도상환수수료 계산", label: "중도상환수수료 계산 — 방법·예시" },
  items: [
    { slug: "prepayment-fee-3-years", keyword: "중도상환수수료 3년", label: "중도상환수수료 3년 — 언제부터 0원" },
    { slug: "prepayment-fee-calculator", keyword: "중도상환수수료 계산기", label: "중도상환수수료 계산기" },
  ],
};
