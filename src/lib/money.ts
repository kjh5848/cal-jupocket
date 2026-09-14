export function won(v: number): number {
  return Math.round(v);
}
export function formatWon(v: number): string {
  return won(v).toLocaleString("ko-KR") + "원";
}

// 입력창은 콤마 표시를 위해 type="text"를 쓴다 — 숫자만 뽑아 파싱한다.
export function parseAmount(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
}

export function formatAmountInput(value: number): string {
  return value.toLocaleString("ko-KR");
}

export function currentValueOrDefault(
  rawValue: string,
  defaultValue: number,
): string {
  const hasDigits = /[0-9]/.test(rawValue);
  return formatAmountInput(hasDigits ? parseAmount(rawValue) : defaultValue);
}

/**
 * 문장 안에서 읽는 금액. 150만원, 1억 2,000만원.
 *
 * 표에서는 formatWon 의 전체 자릿수가 맞다 — 줄을 맞춰 비교하는 자리라
 * 자릿수가 정보다. 그런데 문장에서는 "한 명당 1,500,000원이 공제되는데"
 * 처럼 읽혀서 눈이 걸린다. 사람이 말할 때 쓰는 단위로 바꾼다.
 *
 * 만 단위로 안 떨어지면 formatWon 으로 물러선다 — 반올림해서 틀린 금액을
 * 보여주느니 자릿수가 긴 편이 낫다.
 */
export function formatMan(v: number): string {
  if (v === 0) return "0원";
  if (v % 10000 !== 0) return formatWon(v);
  const man = v / 10000;
  if (man < 10000) return `${man.toLocaleString("ko-KR")}만원`;
  const eok = Math.floor(man / 10000);
  const rest = man % 10000;
  return rest === 0
    ? `${eok.toLocaleString("ko-KR")}억원`
    : `${eok.toLocaleString("ko-KR")}억 ${rest.toLocaleString("ko-KR")}만원`;
}
