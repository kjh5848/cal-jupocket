/**
 * 자동차세 연납 시리즈 — 2026-10-13, 1월 묶음 두 번째.
 * 자동완성 16개(keywords/january-2026-10-13.csv)를 허브 + 5편으로 묶었다.
 *   기간·납부기간·연납신청 기간 → 기간
 *   할인·할인율·혜택 → 할인율(반전: 이자율 5% 인데 실제 공제율은 그보다 작다)
 *   방법·연납신청·신청 방법·조회 → 신청 방법
 *   환급·환급 신청·후 차량 매각 → 환급
 *   뜻·연납이란 → 허브
 */
import type { Series } from "./types";

export const vehiclePrepaySeries: Series = {
  id: "vehicle-tax-prepay",
  cluster: "localtax",
  hub: { slug: "vehicle-tax-prepay", keyword: "자동차세 연납", label: "자동차세 연납" },
  items: [
    { slug: "vehicle-tax-prepay-period", keyword: "자동차세 연납 기간", label: "자동차세 연납 기간" },
    { slug: "vehicle-tax-prepay-discount", keyword: "자동차세 연납 할인율", label: "자동차세 연납 할인율" },
    { slug: "vehicle-tax-prepay-amount", keyword: "자동차세 연납 금액", label: "자동차세 연납 금액" },
    { slug: "vehicle-tax-prepay-how", keyword: "자동차세 연납 신청 방법", label: "자동차세 연납 신청 방법" },
    { slug: "vehicle-tax-prepay-refund", keyword: "자동차세 연납 환급", label: "자동차세 연납 환급(차량 매각)" },
  ],
};
