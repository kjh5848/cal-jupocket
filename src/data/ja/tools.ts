/**
 * 일본어판(/ja/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 도감 번호는 한국어 캡션·링크허브가 가리키는 번호라 일본어판에 옮기지 않고,
 * 일본어판에는 일본 제도로 검증된 도구만 들어오기 때문이다.
 *
 * 새 일본어 페이지를 만들면: 여기 한 줄 + (계산이 같은 한국어판이 있으면) src/i18n/alternates.ts 에 짝.
 * basis 는 그 도구가 무엇에 근거하는지 — "math" 는 산술(나라 무관), "jp-law" 는 일본 원문으로 검증한 제도.
 */
export interface JaTool {
  href: string;
  name: string;
  blurb: string;
  type: "money" | "date" | "unit" | "tax" | "labor" | "pension" | "life";
  icon: string;
  basis: "math" | "jp-law";
}

/** 분류 이름(일본어). 색은 한국어판 도감 색과 같다(src/data/tool-types.ts) */
export const JA_TYPE_LABEL: Record<JaTool["type"], string> = {
  money: "お金・金融",
  date: "日付・時間",
  unit: "単位・換算",
  tax: "税金",
  labor: "給与・労働",
  pension: "年金・保険",
  life: "くらし",
};

export const jaTools: JaTool[] = [
  {
    href: "/ja/tools/percent/",
    name: "パーセント計算",
    blurb: "何％か・割引後の価格・増減率・元の値をすぐ計算",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
  {
    href: "/ja/tools/date-diff/",
    name: "日数計算・日付計算",
    blurb: "2つの日付の間は何日か・何日後は何月何日か・土日を除く平日",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
];
