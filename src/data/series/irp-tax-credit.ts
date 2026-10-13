/**
 * IRP 세액공제 시리즈 — 자동완성 키워드 하나에 글 하나.
 *
 * 2026-10-12 사용자가 구글·네이버 자동완성 화면을 보내며 "키워드마다 글을
 * 쓰라" 고 했다. 띄어쓰기만 다른 것(받는 법·받는법·방법, 계산·금액)은 한 편으로
 * 합쳤다. 나머지는 편마다 다른 조문에서 답을 세운다 — 같은 말을 다르게 쓴
 * 얇은 페이지를 줄줄이 만들면 구글이 도어웨이로 본다.
 *
 * 허브(/guide/irp-tax-credit/)가 이 목록을 그대로 그리고,
 * snippet-structure.test.ts 가 이 목록의 글마다 구조를 대조한다.
 */
import type { Series, SeriesItem } from "./types";
export type { SeriesItem } from "./types";

export const IRP_HUB = { slug: "irp-tax-credit", keyword: "irp 세액공제" };

export const irpSeries: SeriesItem[] = [
  { slug: "irp-tax-credit-eligibility", keyword: "irp 세액공제 조건", label: "IRP 세액공제 조건" },
  { slug: "irp-tax-credit-limit", keyword: "irp 세액공제 한도", label: "IRP 세액공제 한도" },
  { slug: "irp-tax-credit-9-million", keyword: "irp 세액공제 900만원", label: "IRP 세액공제 900만원" },
  { slug: "irp-tax-credit-3-million", keyword: "irp 세액공제 300만원", label: "IRP 세액공제 300만원" },
  { slug: "irp-tax-credit-rate", keyword: "irp 세액공제율", label: "IRP 세액공제율 12%·15%" },
  { slug: "irp-tax-credit-calculator", keyword: "irp 세액공제 계산", label: "IRP 세액공제 계산기" },
  { slug: "irp-tax-credit-deadline", keyword: "irp 세액공제 언제까지", label: "IRP 세액공제 언제까지" },
  { slug: "irp-tax-credit-deposit", keyword: "irp 세액공제 입금", label: "IRP 세액공제 입금" },
  { slug: "irp-tax-credit-how-to-claim", keyword: "irp 세액공제 받는 법", label: "IRP 세액공제 받는 법" },
  { slug: "irp-tax-credit-refund", keyword: "irp 세액공제 환급", label: "IRP 세액공제 환급" },
  { slug: "irp-tax-credit-carryover", keyword: "irp 세액공제 이월", label: "IRP 세액공제 이월" },
  { slug: "irp-cancellation-tax", keyword: "irp 세액공제 해지", label: "IRP 세액공제 해지" },
  { slug: "irp-tax-credit-downsides", keyword: "irp 세액공제 단점", label: "IRP 세액공제 단점" },
  { slug: "personal-irp-tax-credit", keyword: "개인형 irp 세액공제", label: "개인형 IRP 세액공제" },
  { slug: "irp-tax-credit-vs-deduction", keyword: "irp 세액공제 소득공제", label: "IRP 세액공제와 소득공제" },
];

/** 연금저축과 같이 쓰는 경우는 기존 글이 받는다. */
export const IRP_WITH_SAVINGS = { slug: "pension-savings-tax-credit", keyword: "연금저축 irp 세액공제" };

export const irpHref = (slug: string) => `/guide/${slug}/`;

export const irpSeriesDef: Series = {
  id: "irp-tax-credit",
  cluster: "retirement",
  hub: { ...IRP_HUB, label: "IRP 세액공제 조건과 한도" },
  items: irpSeries,
  existing: [{ ...IRP_WITH_SAVINGS, label: "연금저축·IRP 세액공제 한도" }],
};
