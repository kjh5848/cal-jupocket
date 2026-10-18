/**
 * 중개보수 시리즈 — 2026-10-18 도구 담기 루틴(roberin #56 부동산 중개보수 계산기). 지방세 — 집·차 클러스터(취득세·재산세와 같은 집 거래 묶음).
 * 자동완성(keywords/ac-brokerage-fee-2026-10-18.csv): 중개보수 · 중개보수 계산기 · 복비 · 복비 계산기 · 부동산 중개수수료 · 중개보수 요율표 ·
 * 중개보수 뜻 · 복비 뜻 · 월세 복비(계산기) · 전세 복비(계산기) · 중개보수 계산기 월세·부가세 · 아파트·원룸·상가 복비 계산기. 금액 줄기 없음 → 프리셋 없음.
 * 근거: 공인중개사법 시행규칙 제20조, [별표 1]·[별표 2], 서울특별시 주택 중개보수 등에 관한 조례 [별표 1] — rates: brokerage-fee-2026.json
 *
 * 중개보수·요율표·뜻·복비 뜻·수수료율 → 허브 / 월세 복비·전세 복비·원룸 → 월세 복비 / 중개보수 계산기·복비 계산기·부가세·상가 → 계산기
 * 쓰지 않은 축: 청년 중개보수비 지원(지자체 사업 — 원문 미확인), 중개수수료 카드·현금영수증·언제(지급 시기 원문 미확인), 네고 방법, 분양권(원문 미확인)
 */
import type { Series } from "./types";

export const brokerageFeeSeries: Series = {
  id: "brokerage-fee",
  cluster: "localtax",
  hub: { slug: "brokerage-fee", keyword: "중개보수 요율표", label: "중개보수 요율표 — 매매·전세·월세" },
  items: [
    { slug: "monthly-rent-brokerage-fee", keyword: "월세 복비", label: "월세 복비 — 월세 × 100·70" },
    { slug: "brokerage-fee-calculator", keyword: "중개보수 계산기", label: "중개보수 계산기" },
  ],
};
