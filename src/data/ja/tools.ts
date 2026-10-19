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
  {
    href: "/ja/tools/compound/",
    name: "積立の複利計算",
    blurb: "初期投資と毎月の積立を年利回りで運用すると何年後にいくらになるか",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/ja/tools/dday/",
    name: "あと何日・カウントダウン",
    blurb: "目標の日付まであと何日か・残り何時間か・今日を1日目と数えた日数",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/ja/tools/age/",
    name: "年齢計算・満年齢",
    blurb: "生年月日から満年齢・数え年・月齢・小学校と中学校の学年を計算",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/ja/tools/birthday-dday/",
    name: "誕生日まであと何日",
    blurb: "次の誕生日まであと何日・何時間か、何曜日か、次の誕生日で何歳になるか",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/ja/tools/unix-time/",
    name: "UNIX時間 変換",
    blurb: "エポック秒・ミリ秒（13桁）を日本時間とUTCの日時に、日時をUNIX時間に変換",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/ja/tools/time-calc/",
    name: "時間計算",
    blurb: "何時間後・何分後は何時か、2つの時刻の間の経過時間を何時間何分で計算",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/ja/tools/service-period/",
    name: "勤続年数 計算",
    blurb: "入社日から終了日まで何年何か月何日か、在籍日数・何年目かを民法の数え方で計算",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/ja/consumption-tax/",
    name: "消費税計算（税抜・税込）",
    blurb: "税抜価格から税込価格、税込価格から税抜価格と消費税額を10％・8％で計算",
    type: "tax",
    icon: "calculator",
    basis: "jp-law",
  },
  {
    href: "/ja/national-pension/",
    name: "国民年金保険料の計算",
    blurb: "令和8年度の月額・前納（2年・1年・6カ月・早割）の割引額・付加年金がいくら増えるかを計算",
    type: "pension",
    icon: "calculator",
    basis: "jp-law",
  },
];
