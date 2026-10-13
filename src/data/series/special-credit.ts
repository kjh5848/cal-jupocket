/**
 * 연말정산 롱테일 세 시리즈 — 2026-10-13. 1월 연말정산 대비(12월 초까지 올린다).
 * 자동완성: '의료비세액공제'·'의료비 세액공제'·'연말정산 의료비', '교육비…', '기부금…' 9개 시드 약 150개.
 * 근거: 소득세법 제34조·제59조의4·제61조, 시행령 제118조의5~7, 조특법 제58조·제76조. rates: special-credit-2026.json
 *
 * 의료비  한도·기준·계산·계산기·세액공제율 → 한도(계산기) / 대상·기본공제대상자·부양가족·소득요건·요건·부모님 → 대상
 *         몰아주기·부부·배우자 → 몰아주기 / 실비·실손보험 → 실손보험 / 안경·산후조리원 → 안경
 *         카드·카드 명의·이월·조회는 쓰지 않았다(신용카드 공제와의 관계 시행령 미확인, 이월 조문 없음, 화면)
 * 교육비  한도·금액·계산·세액공제율 → 한도 / 소득요건·소득요건 폐지·개정·나이·대상·조건·요건 → 소득요건
 *         학원·학원비·수영·예체능·초등학생 학원비 → 학원비 / 학자금 대출 → 학자금 대출
 *         서류·납입증명서는 서식이 시행규칙이라 쓰지 않았다
 * 기부금  한도·한도계산·기준소득금액 → 한도 / 공제율·비율·10만원·100%·혜택·계산 → 공제율
 *         고향사랑 → 고향사랑 / 종교 → 종교 / 이월 → 이월 / 표준세액공제(중복) → 표준세액공제 / 사업자 → 사업자
 *         영수증·등록 방법은 서식·화면이라 쓰지 않았다
 */
import type { Series } from "./types";

export const medicalCreditSeries: Series = {
  id: "medical-credit",
  cluster: "income",
  hub: { slug: "medical-credit", keyword: "의료비세액공제", label: "의료비 세액공제" },
  items: [
    { slug: "medical-credit-limit", keyword: "의료비 세액공제 한도", label: "의료비 세액공제 한도·계산" },
    { slug: "medical-credit-eligibility", keyword: "의료비 세액공제 대상", label: "의료비 세액공제 대상" },
    { slug: "medical-credit-pooling", keyword: "의료비 세액공제 몰아주기", label: "의료비 몰아주기" },
    { slug: "medical-credit-insurance", keyword: "의료비 세액공제 실손보험", label: "의료비 세액공제 실손보험" },
    { slug: "medical-credit-glasses", keyword: "의료비세액공제 안경", label: "의료비 안경·산후조리원" },
  ],
};

export const educationCreditSeries: Series = {
  id: "education-credit",
  cluster: "income",
  hub: { slug: "education-credit", keyword: "교육비세액공제", label: "교육비 세액공제" },
  items: [
    { slug: "education-credit-limit", keyword: "교육비 세액공제 한도", label: "교육비 세액공제 한도" },
    { slug: "education-credit-income", keyword: "교육비세액공제 소득요건", label: "교육비 소득요건 폐지" },
    { slug: "education-credit-academy", keyword: "교육비 세액공제 학원비", label: "교육비 세액공제 학원비" },
    { slug: "education-credit-student-loan", keyword: "교육비 세액공제 학자금 대출", label: "교육비 학자금 대출" },
  ],
};

export const donationCreditSeries: Series = {
  id: "donation-credit",
  cluster: "income",
  hub: { slug: "donation-credit", keyword: "기부금세액공제", label: "기부금 세액공제" },
  items: [
    { slug: "donation-credit-limit", keyword: "기부금 세액공제 한도", label: "기부금 세액공제 한도" },
    { slug: "donation-credit-rate", keyword: "기부금 세액공제율", label: "기부금 세액공제율" },
    { slug: "hometown-donation-credit", keyword: "고향사랑기부금 세액공제", label: "고향사랑기부금 세액공제" },
    { slug: "religious-donation-credit", keyword: "종교 기부금 세액공제", label: "종교 기부금 세액공제" },
    { slug: "donation-credit-carryover", keyword: "기부금 세액공제 이월", label: "기부금 세액공제 이월" },
    { slug: "donation-credit-standard", keyword: "기부금세액공제 표준세액공제", label: "기부금과 표준세액공제" },
    { slug: "donation-credit-business", keyword: "기부금 세액공제 사업자", label: "기부금 세액공제 사업자" },
  ],
};
