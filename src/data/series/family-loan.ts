/**
 * 가족간 차용증 시리즈 — 2026-10-16. v52 2순위(차용증 검색 44,415 · 광고 클릭 1,589 · 1천 회당 35.8).
 * 클릭의 75%는 '양식' 다운로드라, 우리 글은 세금 쪽(무이자·저리 대출의 증여, 이자 원천징수, 대신 갚아 주면 증여 추정)으로만 받는다.
 * 자동완성: 가족간 차용증 이자율 690 · 쓰는 법 540 · 무이자 260 · 공증 230 / 차용증 쓰는법 6,640 · 법적효력 3,680.
 * 근거: 상증법 제41조의4·제45조, 시행령 제31조의4·제34조, 시행규칙 제10조의5, 법인세법 시행규칙 제43조 ②, 민법 제598조·제603조.
 * rates: family-loan-2026.json
 */
import type { Series } from "./types";

export const familyLoanSeries: Series = {
  id: "family-loan",
  cluster: "inheritance",
  hub: { slug: "family-loan", keyword: "가족간 차용증", label: "가족간 차용증 — 증여세 기준" },
  items: [
    { slug: "family-loan-interest", keyword: "가족간 차용증 이자율", label: "가족간 차용증 이자율 4.6% — 계산" },
    { slug: "family-loan-howto", keyword: "차용증 쓰는법", label: "차용증 쓰는법 — 세금 때문에 적을 칸" },
  ],
};
