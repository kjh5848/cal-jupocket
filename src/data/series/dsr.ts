/**
 * DSR 시리즈 — 2026-10-18 도구 담기 루틴(roberin #313 DSR계산기). 돈·금융 클러스터, 대출이자·마이너스통장 시리즈와 이어진다.
 * 자동완성(keywords/ac-dsr-2026-10-18.csv): DSR 계산기 · dsr 계산 방법 · dsr 뜻 · dsr 40% · dsr 규제 · dsr 한도 · 연봉 dsr 한도 ·
 * dsr 계산기 마통·부부합산 · 주담대·신용대출·전세대출 dsr 계산기 · 스트레스 dsr(1~3단계·금리·적용 기준·계산기). 금액 줄기 없음 → 프리셋 없음.
 * 근거: 은행업감독규정 별표 6 제4장 4. 가목, 은행업감독업무시행세칙 별표 18 제12호·제12-1호·제12-2호·<표 3> — rates: dsr-2026.json
 *
 * DSR 계산·뜻·계산 방법·마통·전세대출 → 허브 / DSR 40%·규제·한도·연봉 한도·부부합산·스트레스 → 한도 / DSR 계산기 → 계산기
 * 쓰지 않은 축: 스트레스 금리 숫자(금융위 행정지도 — 최신 값 원문 미확인), 2금융권 50%(업권별 감독규정 미확인), LTV·DTI(별표 6 제2·3장 — 다음 후보),
 * 토스·네이버 dsr 계산기(상품명)
 */
import type { Series } from "./types";

export const dsrSeries: Series = {
  id: "dsr",
  cluster: "money",
  hub: { slug: "dsr", keyword: "DSR 계산", label: "DSR 계산 — 뜻·대출 종류별" },
  items: [
    { slug: "dsr-limit", keyword: "DSR 한도", label: "DSR 한도 — 40%·1억 초과" },
    { slug: "dsr-calculator", keyword: "DSR 계산기", label: "DSR 계산기" },
  ],
};
