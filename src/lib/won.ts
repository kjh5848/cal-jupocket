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

/** 억·천만 단위 표기. 240000000 → "2억4천만원", 70000000 → "7천만원", 21000000 → "2,100만원". 만원 미만이 있으면 won() */
export function eokwon(n: number): string {
  if (n % 10_000 !== 0) return won(n);
  const eok = Math.floor(n / 100_000_000);
  const man = Math.floor((n % 100_000_000) / 10_000);
  const manPart = !man ? "" : man % 1000 === 0 ? `${man / 1000}천만` : `${man.toLocaleString("ko-KR")}만`;
  return `${eok ? `${eok.toLocaleString("ko-KR")}억` : ""}${manPart || (eok ? "" : "0")}원`;
}
