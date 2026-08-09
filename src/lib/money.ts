export function won(v: number): number {
  return Math.round(v);
}
export function formatWon(v: number): string {
  return won(v).toLocaleString("ko-KR") + "원";
}
