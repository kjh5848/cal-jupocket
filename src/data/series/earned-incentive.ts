/**
 * 근로장려금 시리즈 — 2026-10-13.
 * 자동완성 '근로장려금'(21, 네이버 10 + 구글 15 중복 제외)을 허브 + 5편으로 묶었다.
 * 네이버 30일 검색량(2026-10-13): 근로장려금 85,100 · 대상 17,650 · 신청방법 3,050 · 조건 1,440.
 *   2026·디시 → 허브(디시는 커뮤니티 이름이라 쓰지 않음)
 *   대상·대상자 확인·조건·조건 확인·조건 나이·기준 → 대상
 *   금액·액수·지급액 계산·지급액 조회 → 금액(계산기 포함)
 *   신청·신청기간·신청 기간·신청방법·근로장려금신청 → 신청 기간
 *   2026 근로장려금 상반기 → 반기 신청
 *   지급일·지급일 디시·조회 → 지급일
 * 근거: 조세특례제한법 제100조의2~제100조의8, 시행령 제100조의2·제100조의6~제100조의9.
 * 시행령 별표 11 산정표는 읽지 않았다 — 금액은 법 식으로 한 어림이다.
 */
import type { Series } from "./types";

export const earnedIncentiveSeries: Series = {
  id: "earned-incentive",
  cluster: "income",
  hub: { slug: "earned-incentive", keyword: "근로장려금", label: "근로장려금" },
  items: [
    { slug: "earned-incentive-eligibility", keyword: "근로장려금 대상", label: "근로장려금 대상·조건" },
    { slug: "earned-incentive-amount", keyword: "근로장려금 금액", label: "근로장려금 금액" },
    { slug: "earned-incentive-apply", keyword: "근로장려금 신청 기간", label: "근로장려금 신청 기간" },
    { slug: "earned-incentive-half-year", keyword: "2026 근로장려금 상반기", label: "근로장려금 반기 신청" },
    { slug: "earned-incentive-pay-date", keyword: "근로장려금 지급일", label: "근로장려금 지급일" },
  ],
};
