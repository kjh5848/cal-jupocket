/**
 * 적금 이자 시리즈 — 2026-10-19 도구 담기 루틴(roberin #40 적금 만기 수령액 계산기). 돈·금융 클러스터 네 번째 시리즈.
 * 자동완성(keywords/ac-installment-savings-2026-10-19.csv): 적금 이자·적금 이자 계산기·적금 만기 계산·정기적금 이자계산·
 * 정기적금이자계산하는방법 · 적금 단리 복리·구분법·적금계산기 연복리·일복리 · 은행 적금 계산기·적금 이자율 계산기.
 * 근거: 적립식예금약관 제4조 ①(저축금마다 입금일부터 만기일 전날까지) · 소득세법 제129조 ① 1호(14%)·지방세법 제103조의13(10%)·
 * 국고금 관리법 제47조 ①(10원 미만 버림) — rates: installment-savings-2026.json
 *
 * 이자 계산·계산하는 방법·만기 계산 → 허브 / 단리 복리·구분법·연 이율보다 적은 이유 → 단리·복리 / 이자 계산기 → 계산기
 * 2026-10-24 도구 담기 루틴(roberin #35)이 선납이연 계산기를 더함(keywords/ac-prepay-defer-2026-10-24.csv: 선납이연·뜻·계산기·6-1-5 적금·6-6·1-11 하는법) — 약관 제4조 ③④.
 * 쓰지 않은 축: 적금 이자율 높은 은행(상품 금리 — 원문으로 닫히지 않음), 청년미래적금·군적금(정부 지원 요건 원문 미확인), 일복리(약관 원문 없음)
 */
import type { Series } from "./types";

export const installmentSavingsSeries: Series = {
  id: "installment-savings",
  cluster: "money",
  hub: { slug: "installment-savings-interest", keyword: "적금 이자 계산", label: "적금 이자 계산 — 방법·만기 수령액" },
  items: [
    { slug: "installment-savings-simple-compound", keyword: "적금 단리 복리", label: "적금 단리 복리 — 이자가 적은 이유" },
    { slug: "installment-savings-calculator", keyword: "적금 이자 계산기", label: "적금 이자 계산기" },
    { slug: "prepay-defer-calculator", keyword: "선납이연 계산기", label: "선납이연 계산기 — 만기 늦어지는 날" },
  ],
};
