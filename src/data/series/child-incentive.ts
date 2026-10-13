/**
 * 자녀장려금 시리즈 — 2026-10-13.
 * 자동완성 '자녀장려금'(22)을 허브 + 4편으로 묶었다.
 *   내용·기준·2026·2027 → 허브
 *   금액·금액 확인·지급액 계산 → 금액(계산기 포함)
 *   대상·조건·신청 조건·기준·근로 자녀장려금 기준 → 신청 조건
 *   신청·신청 기간·신청 방법·자녀장려금신청 → 신청 기간
 *   지급일·지급시기·2026 자녀장려금 지급일·조회·신청 조회 → 지급일
 * 근거: 조세특례제한법 제100조의27~제100조의31(준용 제100조의3~제100조의8), 시행령 제100조의28~제100조의31.
 * 시행령 별표 11의2 산정표는 읽지 않았다 — 금액은 법 식으로 한 어림이다.
 */
import type { Series } from "./types";

export const childIncentiveSeries: Series = {
  id: "child-incentive",
  cluster: "income",
  hub: { slug: "child-incentive", keyword: "자녀장려금", label: "자녀장려금" },
  items: [
    { slug: "child-incentive-amount", keyword: "자녀장려금 금액", label: "자녀장려금 금액" },
    { slug: "child-incentive-eligibility", keyword: "자녀장려금 신청 조건", label: "자녀장려금 신청 조건" },
    { slug: "child-incentive-apply", keyword: "자녀장려금 신청 기간", label: "자녀장려금 신청 기간" },
    { slug: "child-incentive-pay-date", keyword: "자녀장려금 지급일", label: "자녀장려금 지급일" },
  ],
};
