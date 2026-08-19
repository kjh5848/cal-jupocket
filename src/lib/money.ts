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
