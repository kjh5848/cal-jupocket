/**
 * 연말정산 시리즈 — 2026-10-13, 1월 묶음 네 번째.
 * 자동완성 '연말정산'(18) + '연말정산 환급금'(17)을 허브 + 12편 + 기존 1편으로 묶었다.
 *   간소화·간소화 서비스·미리보기 → 간소화
 *   계산기·환급금 계산기·환급금 계산 → 계산기
 *   신용카드 공제·카드공제 한도 → 신용카드 공제
 *   월세 세액공제·월세 연말정산 → 월세 세액공제
 *   환급금 지급일·언제·조회 기간·2026 → 지급일
 *   환급금 받는 법·받는법·신청·신청 방법·조회·조회 방법 → 받는 법
 *   환급금 얼마·평균·기준·한도 → 얼마(평균은 통계라 쓰지 않음)
 *   기간·시기 → 기존 41번
 *   뜻·하는법 → 허브
 * 디시·분개·회계처리는 쓰지 않았다(커뮤니티 이름, 회계 기준).
 * '세금 더 내는 경우' 는 10-12 사용자 화면의 구글 자동완성에서 왔다.
 * 자녀세액공제(10-13 추가): 자동완성 '자녀세액공제'·'연말정산 자녀세액공제'(33) —
 *   나이·나이 2026·나이 개정·8세·10세·2026 → 나이 / 금액 / 대상·조건·요건·기준·기본공제·소득 → 대상
 *   장애인 → 장애인 / 개정 → 나이 절. 자녀장려금(조특법)·7세 미만은 쓰지 않았다(읽지 않음)
 */
import type { Series } from "./types";

export const yearEndSeries: Series = {
  id: "year-end",
  cluster: "income",
  hub: { slug: "year-end-tax", keyword: "연말정산", label: "연말정산" },
  existing: [{ slug: "year-end-settlement", keyword: "연말정산 기간", label: "연말정산 기간과 순서" }],
  items: [
    { slug: "year-end-simplified", keyword: "연말정산 간소화", label: "연말정산 간소화" },
    { slug: "year-end-calculator", keyword: "연말정산 계산기", label: "연말정산 계산기" },
    { slug: "year-end-income-deduction", keyword: "연말정산 소득공제", label: "연말정산 소득공제" },
    { slug: "year-end-personal-deduction", keyword: "연말정산 인적공제", label: "연말정산 인적공제" },
    { slug: "year-end-card-deduction", keyword: "연말정산 신용카드 공제", label: "연말정산 신용카드 공제" },
    { slug: "year-end-rent-credit", keyword: "연말정산 월세 세액공제", label: "연말정산 월세 세액공제" },
    { slug: "year-end-refund-date", keyword: "연말정산 환급금 지급일", label: "연말정산 환급금 지급일" },
    { slug: "year-end-refund-how", keyword: "연말정산 환급금 받는 법", label: "연말정산 환급금 받는 법" },
    { slug: "year-end-refund-amount", keyword: "연말정산 환급금 얼마", label: "연말정산 환급금 얼마" },
    { slug: "year-end-refund-unpaid", keyword: "연말정산 환급금 미지급", label: "연말정산 환급금 미지급" },
    { slug: "year-end-extra-tax", keyword: "연말정산 세금 더 내는 경우", label: "연말정산 세금 더 내는 경우" },
    { slug: "year-end-correction", keyword: "연말정산 경정청구", label: "연말정산 경정청구" },
    { slug: "year-end-child-tax-credit", keyword: "연말정산 자녀세액공제", label: "연말정산 자녀세액공제" },
  ],
};
