/**
 * 증여세·상속세 두 시리즈 — 2026-10-13. keywords/today-100-2026-10-13.csv 의 증여세 9개·상속세 7개를 전부 쓴다.
 * 자동완성(증여세·상속세·증여세 신고·상속세 면제한도·증여세 세율·상속세 세율) 약 120개와 합쳐 묶었다.
 * 근거: 상속세 및 증여세법 제4조의2·제13조·제18조~제27조·제47조·제53조·제53조의2·제55조~제57조·제67조~제71조.
 *
 * 증여세  증여세·뜻·누가 내나요·상속세 차이·면제 대상 → 허브
 *         면제한도·면제·한도·결혼 증여 → 기존 /guide/gift-tax/ (같은 주소, 구조만 맞춤)
 *         세율·세율표·율·구간·누진공제·5억·2026 → 세율 / 계산·계산기 → 계산기
 *         신고·신고방법·증여신고·신고는 누가·홈택스·자녀 신고 → 신고 / 신고기한·기간·지나면·안하면 → 신고기한
 *         기준·과세가액·10년 합산 → 기준
 * 상속세  상속세·뜻·증여세 차이·기준·공제 → 허브
 *         면제한도·면제·2026·배우자·부모·형제 → 기존 /guide/inheritance-tax/ (같은 주소, 구조만 맞춤)
 *         세율·세율표·율·구간·누진 공제 → 세율 / 개편·개정·면제한도 상향·세율 인하 → 개편
 *         신고·신고 안해도 되는 경우 → 신고 / 자녀공제·자녀 면제한도 → 자녀공제 / 공제한도 → 공제한도
 * 계산기  상속세 계산기는 /inheritance/ (가이드 밖) 를 링크한다. 증여세 계산기는 이번에 만든다.
 */
import type { Series } from "./types";

export const giftSeries: Series = {
  id: "gift-tax",
  cluster: "inheritance",
  hub: { slug: "gift-tax-guide", keyword: "증여세", label: "증여세" },
  existing: [{ slug: "gift-tax", keyword: "증여세 면제한도", label: "증여세 면제한도" }],
  items: [
    { slug: "gift-tax-rate", keyword: "증여세 세율", label: "증여세 세율" },
    { slug: "gift-tax-calculator", keyword: "증여세 계산기", label: "증여세 계산기" },
    { slug: "gift-tax-filing", keyword: "증여세 신고", label: "증여세 신고 방법" },
    { slug: "gift-tax-deadline", keyword: "증여세 신고기한", label: "증여세 신고기한" },
    { slug: "gift-tax-criteria", keyword: "증여세 기준", label: "증여세 기준" },
    // 2026-10-14 v43 — 자동완성+광고 클릭(v39)에서 자녀 증여 한도 20,210(308)·자녀 결혼자금 증여 3,090(27)
    { slug: "child-gift-limit", keyword: "자녀 증여 한도", label: "자녀 증여 한도" },
    { slug: "child-wedding-gift", keyword: "자녀 결혼자금 증여", label: "자녀 결혼자금 증여" },
  ],
};

export const inheritanceSeries: Series = {
  id: "inheritance-tax",
  cluster: "inheritance",
  hub: { slug: "inheritance-tax-guide", keyword: "상속세", label: "상속세" },
  existing: [{ slug: "inheritance-tax", keyword: "상속세 면제한도", label: "상속세 면제한도" }],
  items: [
    { slug: "inheritance-tax-rate", keyword: "상속세 세율", label: "상속세 세율" },
    { slug: "inheritance-tax-reform", keyword: "상속세 개편", label: "상속세 개편" },
    { slug: "inheritance-tax-filing", keyword: "상속세 신고", label: "상속세 신고" },
    { slug: "inheritance-child-deduction", keyword: "상속세 자녀공제", label: "상속세 자녀공제" },
    { slug: "inheritance-deduction-limit", keyword: "상속세 공제한도", label: "상속세 공제한도" },
  ],
};
