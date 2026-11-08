/**
 * 대출 질문 100개 — 해석기(loan-parse)와 AI 모델 비교의 채점표.
 * 기대값은 사람이 문장을 읽고 적었다. 문장에 없는 값은 적지 않는다(undefined = 물어봐야 하는 값).
 * scope: "calc" 계산할 질문 / "out" 계산기로 답할 수 없는 질문(은행 추천·자격·특정 상품 금리)
 */
import type { LoanQuery } from "../loan-parse";

export interface Case {
  q: string;
  want: LoanQuery;
  scope?: "calc" | "out";
}

const 억 = 1e8;
const 만 = 1e4;

export const CASES: Case[] = [
  // 1~20 기본형
  { q: "3억 4.5% 30년 원리금균등이면 한 달에 얼마예요?", want: { principal: 3 * 억, ratePct: 4.5, months: 360, method: "level" } },
  { q: "2억 대출 금리 4% 20년이면 월 상환액", want: { principal: 2 * 억, ratePct: 4, months: 240 } },
  { q: "1억 5천 3.8% 10년 원금균등", want: { principal: 1.5 * 억, ratePct: 3.8, months: 120, method: "principal" } },
  { q: "5천만원 5% 5년 만기일시 이자 얼마", want: { principal: 5000 * 만, ratePct: 5, months: 60, method: "bullet" } },
  { q: "3억5천 연 4.2% 30년", want: { principal: 3.5 * 억, ratePct: 4.2, months: 360 } },
  { q: "주담대 4억 30년 4.1프로 원리금균등 월 납입금", want: { principal: 4 * 억, ratePct: 4.1, months: 360, method: "level" } },
  { q: "신용대출 3천만원 금리 6.5% 3년", want: { principal: 3000 * 만, ratePct: 6.5, months: 36 } },
  { q: "전세대출 2억 4천 3.5% 2년 이자만 내면 매달 얼마", want: { principal: 2.4 * 억, ratePct: 3.5, months: 24, method: "bullet" } },
  { q: "1억 원 4.5퍼센트 15년", want: { principal: 1 * 억, ratePct: 4.5, months: 180 } },
  { q: "대출 2억5000만원 이율 3.9% 기간 25년", want: { principal: 2.5 * 억, ratePct: 3.9, months: 300 } },
  { q: "7천만원 4% 36개월 원리금균등", want: { principal: 7000 * 만, ratePct: 4, months: 36, method: "level" } },
  { q: "1000만원 7% 12개월", want: { principal: 1000 * 만, ratePct: 7, months: 12 } },
  { q: "5억 3.7% 40년 원리금 균등 상환", want: { principal: 5 * 억, ratePct: 3.7, months: 480, method: "level" } },
  { q: "3억 4% 30년 원금 균등이면 첫 달 얼마", want: { principal: 3 * 억, ratePct: 4, months: 360, method: "principal" } },
  { q: "자동차 할부 3000만원 5.9% 60개월", want: { principal: 3000 * 만, ratePct: 5.9, months: 60 } },
  { q: "2억 원 금리 4.25% 30년 만기", want: { principal: 2 * 억, ratePct: 4.25, months: 360 } },
  { q: "1.5억 4% 20년", want: { principal: 1.5 * 억, ratePct: 4, months: 240 } },
  { q: "300000000원 4.5% 360개월", want: { principal: 3 * 억, ratePct: 4.5, months: 360 } },
  { q: "300,000,000원 4.5% 30년", want: { principal: 3 * 억, ratePct: 4.5, months: 360 } },
  { q: "8천 4.3% 10년 원리금균등", want: { principal: 8000 * 만, ratePct: 4.3, months: 120, method: "level" } },

  // 21~40 거치기간·순서 바꾸기
  { q: "3억 4.5% 30년 거치 1년 원리금균등", want: { principal: 3 * 억, ratePct: 4.5, months: 360, method: "level", graceMonths: 12 } },
  { q: "2억 4% 20년 1년 거치 원금균등", want: { principal: 2 * 억, ratePct: 4, months: 240, method: "principal", graceMonths: 12 } },
  { q: "거치기간 6개월 1억 5% 10년", want: { principal: 1 * 억, ratePct: 5, months: 120, graceMonths: 6 } },
  { q: "30년 동안 4.5%로 3억 빌리면 매달 얼마?", want: { principal: 3 * 억, ratePct: 4.5, months: 360 } },
  { q: "금리 3.9%에 25년, 2억 7천 원리금균등", want: { principal: 2.7 * 억, ratePct: 3.9, months: 300, method: "level" } },
  { q: "20년 4% 1억", want: { principal: 1 * 억, ratePct: 4, months: 240 } },
  { q: "4.7% 3억 2천 30년", want: { principal: 3.2 * 억, ratePct: 4.7, months: 360 } },
  { q: "10년간 5천만원을 연 6%로 빌리면 총 이자가 얼마나 돼요", want: { principal: 5000 * 만, ratePct: 6, months: 120 } },
  { q: "3년 거치 27년 분할 3억 4%", want: { principal: 3 * 억, ratePct: 4, months: 360, graceMonths: 36 } },
  { q: "2억 3천5백만원 4.1% 30년", want: { principal: 2.35 * 억, ratePct: 4.1, months: 360 } },
  { q: "1억2천 3.5% 15년 원금균등", want: { principal: 1.2 * 억, ratePct: 3.5, months: 180, method: "principal" } },
  { q: "만기일시상환 1억 4.8% 3년", want: { principal: 1 * 억, ratePct: 4.8, months: 36, method: "bullet" } },
  { q: "4억 5천만원 대출 4% 30년 원리금균등 총이자", want: { principal: 4.5 * 억, ratePct: 4, months: 360, method: "level" } },
  { q: "6억 3.95% 35년", want: { principal: 6 * 억, ratePct: 3.95, months: 420 } },
  { q: "9천만원 3.2% 2년 일시상환", want: { principal: 9000 * 만, ratePct: 3.2, months: 24, method: "bullet" } },
  { q: "500만원 10% 6개월", want: { principal: 500 * 만, ratePct: 10, months: 6 } },
  { q: "2000만원 8.5% 24개월 원리금균등", want: { principal: 2000 * 만, ratePct: 8.5, months: 24, method: "level" } },
  { q: "3억 4.5% 30년 원리금이랑 원금균등 차이", want: { principal: 3 * 억, ratePct: 4.5, months: 360 } },
  { q: "1억 4천 4.4% 20년 거치 2년", want: { principal: 1.4 * 억, ratePct: 4.4, months: 240, graceMonths: 24 } },
  { q: "2억 연 3.6% 30년 원금균등 상환 마지막 달", want: { principal: 2 * 억, ratePct: 3.6, months: 360, method: "principal" } },

  // 41~60 빠진 값(되물어야 함)
  { q: "3억 30년이면 매달 얼마예요", want: { principal: 3 * 억, months: 360 } },
  { q: "금리 4.5% 30년 원리금균등", want: { ratePct: 4.5, months: 360, method: "level" } },
  { q: "2억 4% 대출 이자", want: { principal: 2 * 억, ratePct: 4 } },
  { q: "1억 빌리면 이자 얼마", want: { principal: 1 * 억 } },
  { q: "원리금균등이랑 원금균등 뭐가 나아요?", want: {} },
  { q: "5천만원 3년 신용대출", want: { principal: 5000 * 만, months: 36 } },
  { q: "4% 20년", want: { ratePct: 4, months: 240 } },
  { q: "3억 4.5%", want: { principal: 3 * 억, ratePct: 4.5 } },
  { q: "대출 이자 계산 어떻게 해요", want: {} },
  { q: "만기일시상환이 뭐예요", want: { method: "bullet" } },
  { q: "주담대 3억 받으려는데 월 얼마 나가요", want: { principal: 3 * 억 } },
  { q: "30년 만기 4.2% 대출", want: { ratePct: 4.2, months: 360 } },
  { q: "1억 7천 10년", want: { principal: 1.7 * 억, months: 120 } },
  { q: "거치 1년 하면 이자 얼마나 늘어요", want: { graceMonths: 12 } },
  { q: "금리 0.5% 오르면 얼마 더 내요", want: { ratePct: 0.5 } },
  { q: "2억 대출 15년 vs 30년", want: { principal: 2 * 억, months: 180 } },
  { q: "4억 대출 원금균등 첫달", want: { principal: 4 * 억, method: "principal" } },
  { q: "6% 5년 차 할부", want: { ratePct: 6, months: 60 } },
  { q: "전세자금 1억 6천 2년", want: { principal: 1.6 * 억, months: 24 } },
  { q: "이자만 내면 매달 얼마? 2억 4%", want: { principal: 2 * 억, ratePct: 4, method: "bullet" } },

  // 61~80 계산기 범위 밖
  { q: "지금 주담대 금리 제일 낮은 은행 어디예요?", want: {}, scope: "out" },
  { q: "디딤돌 대출 자격 되나요? 연봉 5천", want: {}, scope: "out" },
  { q: "카카오뱅크 신용대출 금리 몇 프로예요", want: {}, scope: "out" },
  { q: "DSR 40% 넘으면 대출 안 되나요", want: {}, scope: "out" },
  { q: "버팀목 대출 한도 얼마예요", want: {}, scope: "out" },
  { q: "고정금리랑 변동금리 뭐가 좋아요", want: {}, scope: "out" },
  { q: "중도상환수수료 얼마예요", want: {}, scope: "out" },
  { q: "LTV 70%면 5억 집에 얼마 빌려요", want: {}, scope: "out" },
  { q: "신혼부부 특례 대출 금리", want: {}, scope: "out" },
  { q: "대출 갈아타기 해야 할까요", want: {}, scope: "out" },
  { q: "국민은행 전세대출 금리 알려줘", want: {}, scope: "out" },
  { q: "보금자리론 조건", want: {}, scope: "out" },
  { q: "연봉 4천이면 대출 얼마까지 돼요", want: {}, scope: "out" },
  { q: "주식 투자하려고 대출 받아도 될까요", want: {}, scope: "out" },
  { q: "신용점수 올리는 법", want: {}, scope: "out" },
  { q: "스트레스 DSR 언제부터", want: {}, scope: "out" },
  { q: "대환대출 한도", want: {}, scope: "out" },
  { q: "청년 전세대출 나이 제한", want: {}, scope: "out" },
  { q: "마이너스 통장 이자 계산", want: {}, scope: "out" },
  { q: "카드론 금리 몇 프로가 정상이에요", want: {}, scope: "out" },

  // 81~100 말투·띄어쓰기·오타
  { q: "삼억 사점오프로 삼십년", want: { principal: 3 * 억, ratePct: 4.5, months: 360 } },
  { q: "3억을4.5%로30년동안", want: { principal: 3 * 억, ratePct: 4.5, months: 360 } },
  { q: "3 억 4.5 % 30 년", want: { principal: 3 * 억, ratePct: 4.5, months: 360 } },
  { q: "２억 ４％ ２０년", want: { principal: 2 * 억, ratePct: 4, months: 240 } },
  { q: "이억 4% 20년", want: { principal: 2 * 억, ratePct: 4, months: 240 } },
  { q: "대출금 1억, 연이율 5%, 기간 10년, 원리금균등분할상환", want: { principal: 1 * 억, ratePct: 5, months: 120, method: "level" } },
  { q: "원금 2억 / 금리 3.5% / 30년 / 원금균등", want: { principal: 2 * 억, ratePct: 3.5, months: 360, method: "principal" } },
  { q: "2억정도 4프로 20년쯤", want: { principal: 2 * 억, ratePct: 4, months: 240 } },
  { q: "1억 오천 4% 10년", want: { principal: 1.5 * 억, ratePct: 4, months: 120 } },
  { q: "3억 4.5% 30년 원리금 균등 분할", want: { principal: 3 * 억, ratePct: 4.5, months: 360, method: "level" } },
  { q: "제가 3억을 빌렸는데요 금리가 4.5%고 30년이에요 매달 얼마 내야 돼요?", want: { principal: 3 * 억, ratePct: 4.5, months: 360 } },
  { q: "집 사려고 3억 5천 대출, 금리는 연 4.3, 기간 30년", want: { principal: 3.5 * 억, ratePct: 4.3, months: 360 } },
  { q: "1억 3% 1년", want: { principal: 1 * 억, ratePct: 3, months: 12 } },
  { q: "50만원 15% 10개월", want: { principal: 50 * 만, ratePct: 15, months: 10 } },
  { q: "10억 4% 30년", want: { principal: 10 * 억, ratePct: 4, months: 360 } },
  { q: "2억 4% 20년인데 3년 거치", want: { principal: 2 * 억, ratePct: 4, months: 240, graceMonths: 36 } },
  { q: "4억 30년 원리금균등 4.05%", want: { principal: 4 * 억, ratePct: 4.05, months: 360, method: "level" } },
  { q: "2억 1천 3.85% 360개월", want: { principal: 2.1 * 억, ratePct: 3.85, months: 360 } },
  { q: "1억 4.5% 5년 만기 일시 상환", want: { principal: 1 * 억, ratePct: 4.5, months: 60, method: "bullet" } },
  { q: "7억 3.9% 50년 원리금균등", want: { principal: 7 * 억, ratePct: 3.9, months: 600, method: "level" } },
];
