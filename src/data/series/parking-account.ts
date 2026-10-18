/**
 * 파킹통장 이자 시리즈 — 2026-10-19 도구 담기 루틴(roberin #46 파킹통장 이자 계산기). 돈·금융 클러스터 여섯 번째 시리즈.
 * 자동완성(keywords/ac-parking-account-2026-10-19.csv): 파킹통장 이자·이자 계산·계산 방법·이자 계산기·이자계산기 ·
 * 파킹통장 세금·이자소득세 · 파킹통장 이자 지급일 · 파킹통장 이자율·이자 비교·높은순 · 카카오뱅크·케이뱅크 파킹통장 이자.
 * 근거: 신한 입출금이 자유로운 예금약관 제2조 ②(매일 최종잔액) · 광주은행 매일이자Wa파킹통장 금리안내(구간별 잔액 × 금리 ÷ 365) ·
 * 소득세법 제129조 ① 1호(14%)·지방세법 제103조의13(10%)·국고금 관리법 제47조 ①(10원 미만 버림) — rates: parking-account-2026.json
 *
 * 이자 계산·계산 방법·지급일 → 허브 / 세금·이자소득세 → 세금 / 이자 계산기 → 계산기
 * 쓰지 않은 축: 이자율·비교·높은순·은행별 이자(상품 금리 — 원문으로 닫히지 않고 바뀜), 잔액 전체 적용·366일(원문 미확인)
 */
import type { Series } from "./types";

export const parkingAccountSeries: Series = {
  id: "parking-account",
  cluster: "money",
  hub: { slug: "parking-account-interest", keyword: "파킹통장 이자 계산", label: "파킹통장 이자 계산 — 매일 잔액·구간 금리" },
  items: [
    { slug: "parking-account-tax", keyword: "파킹통장 세금", label: "파킹통장 세금 — 이자 받을 때 떼는 이자소득세" },
    { slug: "parking-account-interest-calculator", keyword: "파킹통장 이자 계산기", label: "파킹통장 이자 계산기" },
  ],
};
