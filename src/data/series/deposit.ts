/**
 * 예금 이자 시리즈 — 2026-10-18 도구 담기 루틴(roberin #36 예금이자계산기). 돈·금융 클러스터 세 번째 시리즈.
 * 자동완성(keywords/ac-deposit-interest-2026-10-18.csv): 예금 이자 계산·계산 방법·계산하는법 · 1억 예금 이자(3%·5%·한달·1년) ·
 * 예금 단리 복리 차이·확인 방법 · 예금 이자 계산기·세후·세금 계산기 · 정기예금 이자 세금 · 예금이자계산기일수.
 * 근거: 소득세법 제129조 ① 1호(14%)·지방세법 제103조의13(10%)·국고금 관리법 제47조 ①(10원 미만 버림) — rates: deposit-2026.json
 *
 * 이자 계산·계산 방법·1억 예금 이자 → 허브 / 단리 복리 차이·확인 방법 → 단리·복리 / 이자 계산기·세후 → 계산기
 * 쓰지 않은 축: 예금 이자율·높은 은행(상품 금리 — 원문으로 닫히지 않음), 세금우대(조특법 제89조의3 원문 미확인), 일수 계산(약관 원문 미확인)
 */
import type { Series } from "./types";

export const depositSeries: Series = {
  id: "deposit",
  cluster: "money",
  hub: { slug: "deposit-interest", keyword: "예금 이자 계산", label: "예금 이자 계산 — 방법·세후 이자" },
  items: [
    { slug: "deposit-simple-compound", keyword: "예금 단리 복리 차이", label: "예금 단리 복리 차이" },
    { slug: "deposit-interest-calculator", keyword: "예금 이자 계산기", label: "예금 이자 계산기" },
  ],
};
