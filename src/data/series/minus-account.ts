/**
 * 마이너스통장 이자 시리즈 — 2026-10-18 도구 담기 루틴(roberin #26 마이너스통장 이자 계산기). 돈·금융 클러스터 두 번째 시리즈.
 * 자동완성(keywords/ac-minus-account-2026-10-18.csv): 마이너스통장 이자 계산·계산 방식·계산 기준·이자 기준 · 마이너스통장 이자 납부일·납입 방법·내는법·발생 ·
 * 마이너스통장 이자계산기 · 마이너스통장 1000만원 이자 · 마이너스통장 이자율.
 * 근거: 법령 숫자 없음 — 은행 여신거래약정서 '1년을 365일(윤년은 366일)로 보고 1일 단위로 계산'(rates: overdraft-2026.json)
 *
 * 이자 계산·계산 방식·기준 → 허브 / 이자 납부일·내는법·발생 → 납부일 / 이자계산기·1000만원 이자 → 계산기
 * 쓰지 않은 축: 마이너스통장 이자율(은행·신용마다 다른 상품 금리 — 원문으로 닫히지 않음), 미납 이자 원금 산입·연체
 */
import type { Series } from "./types";

export const minusAccountSeries: Series = {
  id: "minus-account",
  cluster: "money",
  hub: { slug: "minus-account-interest", keyword: "마이너스통장 이자 계산", label: "마이너스통장 이자 계산 — 방식·기준" },
  items: [
    { slug: "minus-account-interest-payment", keyword: "마이너스통장 이자 납부일", label: "마이너스통장 이자 납부일·회차" },
    { slug: "minus-account-calculator", keyword: "마이너스통장 이자 계산기", label: "마이너스통장 이자 계산기" },
  ],
};
