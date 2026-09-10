/**
 * 카드뉴스 세트 정의.
 *
 * 인스타 피드 캐러셀 4:5(1080×1350). 디자인은 실제 고참여 게시물을 보고
 * 정했다 — 밝은 배경, 번호 리스트, 금액표, 형광펜 강조, 그리고 출처.
 * (캐릭터 일러스트를 쓴 게시물은 좋아요 37개였고, 밀도 높은 표는 850개였다.)
 *
 * 숫자는 rates/*.json 검증본에서만 가져온다. 여기에 직접 적은 값도 전부
 * 그 파일과 대조한 것이다 — 확인 안 된 숫자는 카드에 넣지 않는다.
 *
 * 문구 강조: [[형광펜]] {{경고}} — src/lib/card-markup.ts 참고.
 */
import { clusterColor } from "./clusters";

export interface ListCard {
  kind: "list";
  badge: string;
  title: string;
  /** detail 은 한 줄짜리 보조 설명. 카드가 비어 보이지 않게 하는 동시에
   *  "그래서 나한테 얼마인데"를 바로 답해준다. */
  items: { text: string; detail: string }[];
  footnote: string;
}

export interface TableCard {
  kind: "table";
  title: string;
  sub: string;
  rows: { label: string; value: string; tone?: "mark" | "warn" }[];
  footnote: string;
}

export interface NoteCard {
  kind: "note";
  badge: string;
  title: string;
  body: string;
  footnote: string;
}

export interface CtaCard {
  kind: "cta";
  title: string;
  sub: string;
  /** 프로필 링크 허브(data/linkhub.ts)의 번호. 카드가 "13번 글"이라고
   *  지목하면 독자가 허브에서 그 번호를 찾는다. 번호는 고정이라 안전하다. */
  refNo?: number;
}

export type Card = ListCard | TableCard | NoteCard | CtaCard;

export interface CardSet {
  slug: string;
  /** clusters.ts 의 클러스터 id. 액센트 색을 여기서 가져온다. */
  cluster: keyof typeof clusterColor;
  /** 캡션에 붙일 글 주소. */
  link: string;
  cards: Card[];
}

export const cardSets: CardSet[] = [
  {
    slug: "pension-2026",
    cluster: "retirement",
    link: "https://jupocket.com/national-pension-premium/",
    cards: [
      {
        kind: "list",
        badge: "2026 국민연금",
        title: "올해 바뀌는 것 4가지",
        items: [
          {
            text: "보험료율 [[9% → 9.5%]]",
            detail: "월소득 300만원이면 월 28만 5,000원",
          },
          {
            text: "기준소득월액 상한 [[659만원]]",
            detail: "이보다 많이 벌어도 보험료는 그대로",
          },
          {
            text: "기준소득월액 하한 41만원",
            detail: "적게 벌어도 이만큼 기준으로는 냄",
          },
          {
            text: "지역가입자는 {{전액 본인 부담}}",
            detail: "직장인은 회사와 절반씩 나눠 냄",
          },
        ],
        footnote: "2026.7.1~2027.6.30 적용 · 출처 국민연금공단",
      },
      {
        kind: "table",
        title: "월소득별 내 보험료",
        sub: "지역가입자 기준 · 2026년 9.5%",
        rows: [
          { label: "100만원", value: "9만 5,000원" },
          { label: "200만원", value: "19만 원" },
          { label: "300만원", value: "28만 5,000원" },
          { label: "400만원", value: "38만 원", tone: "mark" },
          { label: "500만원", value: "47만 5,000원" },
          { label: "600만원", value: "57만 원" },
          { label: "659만원 이상", value: "62만 6,050원", tone: "warn" },
        ],
        footnote: "10원 미만 절사 · 출처 국민연금공단",
      },
      {
        kind: "note",
        badge: "알아두면 좋은 것",
        title: "659만원에서 멈춥니다",
        body:
          "기준소득월액 상한이 659만원이라, 그 위로는 아무리 벌어도 보험료가 [[더 늘지 않습니다]].\n\n월 700만원을 벌든 1,500만원을 벌든 똑같이 62만 6,050원입니다.\n\n반대로 소득이 41만원보다 적어도 하한 41만원이 적용돼, 그만큼을 기준으로는 내야 합니다.\n\n상한과 하한은 {{매년 7월에 조정}}됩니다.",
        footnote: "출처 국민연금공단",
      },
      {
        kind: "cta",
        title: "표에 없는\n내 소득은?",
        sub: "계산기에 금액만 넣으면 바로 나와요",
        refNo: 13,
      },
    ],
  },
];

export function cardSetBySlug(slug: string): CardSet | undefined {
  return cardSets.find((s) => s.slug === slug);
}
