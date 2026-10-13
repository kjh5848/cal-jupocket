/**
 * 퇴직금·퇴직연금 시리즈 — 2026-10-14. keywords/today-100-2026-10-13.csv 의 퇴직금·퇴직연금 세금 12개를 전부 쓴다.
 * 자동완성(keywords/severance.csv, 약 180개). 근거: 소득세법 제14조·제22조·제48조·제55조·제64조의4·제129조, 지방세법 제92조,
 * 근로자퇴직급여 보장법 제4조·제8조~제10조·제20조~제24조·시행령 제2조·제3조·제3조의2·제14조·제18조, 근로기준법 제2조·제36조·제37조.
 * rates: severance-2026.json
 *
 * 퇴직금 세금·퇴직소득세(세율·몇프로·16.5·계산방법) → 허브 / 퇴직금 세금 계산기·퇴직소득세 계산기 → 계산기
 * 퇴직금 지급기한(14일·지연이자) → 기한 / 퇴직금 중간정산(사유·조건·세금) → 중간정산
 * 퇴직금 IRP·퇴직금 수령방법(의무·법바뀜·55세·일시금) → IRP / 퇴직연금 수령방법(연금·일시금·세금) → 수령방법
 * 연금소득세(1,500만원·5%) → 연금소득세 / 퇴직연금 DC형(퇴사·운용·IRP 이전) → DC형
 * 퇴직연금 중도인출(사유·무주택·세금) → 중도인출 / 퇴직연금 해지(퇴직금 IRP 해지 세금) → 해지
 * 쓰지 않은 축: 은행·증권사별 절차, 중도인출 신청서·서류(금융회사 서식), DC형 ETF 추천(투자 권유), 건설근로자공제회
 */
import type { Series } from "./types";

export const severanceSeries: Series = {
  id: "severance",
  cluster: "retirement",
  hub: { slug: "severance-tax", keyword: "퇴직금 세금", label: "퇴직금 세금(퇴직소득세)" },
  items: [
    { slug: "severance-tax-calculator", keyword: "퇴직금 세금 계산기", label: "퇴직금 세금 계산기" },
    { slug: "severance-pay-deadline", keyword: "퇴직금 지급기한", label: "퇴직금 지급기한" },
    { slug: "severance-interim-settlement", keyword: "퇴직금 중간정산", label: "퇴직금 중간정산" },
    { slug: "severance-irp", keyword: "퇴직금 IRP", label: "퇴직금 IRP·수령방법" },
    { slug: "pension-receipt-method", keyword: "퇴직연금 수령방법", label: "퇴직연금 수령방법" },
    { slug: "pension-income-tax", keyword: "연금소득세", label: "연금소득세" },
    { slug: "dc-pension", keyword: "퇴직연금 DC형", label: "퇴직연금 DC형" },
    { slug: "pension-mid-withdrawal", keyword: "퇴직연금 중도인출", label: "퇴직연금 중도인출" },
    { slug: "pension-termination", keyword: "퇴직연금 해지", label: "퇴직연금 해지" },
  ],
};
