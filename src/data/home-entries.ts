/**
 * 홈 첫 화면 "무엇이 고민이세요?" 입구 카드(2026-11-07, 설계 docs/superpowers/specs/2026-11-07-cta-redesign-design.md 4단계).
 *
 * 카드마다 질문 2개(해설 글)와 계산기 1개 — 어느 것을 눌러도 다음 페이지로 넘어간다.
 * 질문은 독자가 실제로 치는 말투로, 숫자는 예시 표현일 뿐 결과값이 아니다(결과는 글·계산기가 낸다).
 * 주소는 home-entries.test.ts 가 실제 페이지인지 확인한다.
 */
export interface HomeEntry {
  key: string;
  title: string;
  icon: string;
  questions: { q: string; href: string }[];
  calc: { label: string; href: string };
}

export const homeEntries: HomeEntry[] = [
  {
    key: "loan",
    title: "대출·이자",
    icon: "coins",
    questions: [
      { q: "1억 빌리면 이자는 어떻게 붙나요?", href: "/guide/loan-interest/" },
      { q: "먼저 갚으면 수수료가 얼마예요?", href: "/guide/prepayment-fee/" },
    ],
    calc: { label: "대출 이자 계산기", href: "/guide/loan-calculator/" },
  },
  {
    key: "pay",
    title: "월급·실수령",
    icon: "receipt",
    questions: [
      { q: "연봉에서 실제로 손에 쥐는 돈은?", href: "/guide/salary-take-home/" },
      { q: "퇴직금은 얼마나 받나요?", href: "/guide/severance-pay/" },
    ],
    calc: { label: "실수령액 계산기", href: "/guide/take-home-calculator/" },
  },
  {
    key: "tax",
    title: "세금 신고",
    icon: "percent",
    questions: [
      { q: "떼인 3.3%는 돌려받을 수 있나요?", href: "/guide/33-settlement/" },
      { q: "개인사업자 부가세 신고는 어떻게?", href: "/guide/individual-vat-final-return/" },
    ],
    calc: { label: "3.3% 계산기", href: "/freelancer-33/" },
  },
  {
    key: "support",
    title: "정부 지원",
    icon: "checklist",
    questions: [
      { q: "기초연금, 나도 받을 수 있나요?", href: "/guide/basic-pension/#basic-pension-criteria" },
      { q: "자녀장려금은 얼마나 나오나요?", href: "/guide/child-incentive-amount/" },
    ],
    calc: { label: "기초연금 모의계산", href: "/guide/basic-pension-calculator/" },
  },
];
