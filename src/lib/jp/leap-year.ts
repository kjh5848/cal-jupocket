/**
 * 閏年ニ関スル件(明治三十一年勅令第九十号) 그대로의 윤년 판정 — 일본어판 曜日計算(/ja/tools/date-day/) 본문용.
 *
 *   神武天皇即位紀元年数ノ四ヲ以テ整除シ得ヘキ年ヲ閏年トス
 *   但シ紀元年数ヨリ六百六十ヲ減シテ百ヲ以テ整除シ得ヘキモノノ中更ニ四ヲ以テ商ヲ整除シ得サル年ハ平年トス
 *   (e-Gov 法令 API https://laws.e-gov.go.jp/api/1/lawdata/131IO0000000090, 2026-10-20 확인)
 *
 * 紀元年数 = 서기 + 660. 계산기 자체는 lib/date-day.ts 의 isLeap(그레고리력 규칙)을 쓰고,
 * 두 규칙이 같은 답을 낸다는 것을 테스트(jp-leap-year.test.ts)로 고정한다.
 */

/** 서기 → 神武天皇即位紀元年数 */
export const kigenYear = (y: number): number => y + 660;

/** 勅令 문장대로: 紀元年数가 4로 나눠지면 윤년, 단 (紀元年数 − 660)이 100으로 나눠지고 그 몫이 4로 안 나눠지면 평년 */
export function isLeapByChokurei(y: number): boolean {
  const k = kigenYear(y);
  if (k % 4 !== 0) return false;
  const rest = k - 660;
  if (rest % 100 === 0 && (rest / 100) % 4 !== 0) return false;
  return true;
}
