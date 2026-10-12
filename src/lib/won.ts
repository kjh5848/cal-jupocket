/** 원화 표기. 1350000 → "1,350,000원" */
export const won = (n: number): string => n.toLocaleString("ko-KR") + "원";

/** 만원 단위 짧은 표기. 9000000 → "900만원", 1485000 → "148만 5천원" */
export function manwon(n: number): string {
  const man = Math.floor(n / 10_000);
  const rest = n % 10_000;
  const head = man ? `${man.toLocaleString("ko-KR")}만` : "";
  const tail = rest ? (rest % 1000 === 0 ? ` ${rest / 1000}천` : ` ${rest.toLocaleString("ko-KR")}`) : "";
  return `${head}${tail}원`.trim();
}
