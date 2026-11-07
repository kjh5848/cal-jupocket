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
import { guideHref } from "../merged";
import type { Series, SeriesItem } from "./types";
export type { SeriesItem } from "./types";

export const IRP_HUB = { slug: "irp-tax-credit", keyword: "irp 세액공제" };

export const irpSeries: SeriesItem[] = [
  { slug: "irp-tax-credit-calculator", keyword: "irp 세액공제 계산", label: "IRP 세액공제 계산기" },
  { slug: "irp-cancellation-tax", keyword: "irp 세액공제 해지", label: "IRP 세액공제 해지" },
];

/** 연금저축과 같이 쓰는 경우는 기존 글이 받는다. */
export const IRP_WITH_SAVINGS = { slug: "pension-savings-tax-credit", keyword: "연금저축 irp 세액공제" };

export const irpHref = (slug: string) => guideHref(slug);

export const irpSeriesDef: Series = {
  id: "irp-tax-credit",
  cluster: "retirement",
  hub: { ...IRP_HUB, label: "IRP 세액공제 조건과 한도" },
  items: irpSeries,
  existing: [{ ...IRP_WITH_SAVINGS, label: "연금저축·IRP 세액공제 한도" }],
};
