/**
 * 도구 분류 12개 — 설계 3-4·11절. 색은 바꾸지 않는다(카드·뱃지·검색 점이 같은 색).
 * 기존 클러스터 6개는 그대로 대응(income·vat → 세금 …).
 */
export const TOOL_TYPES = [
  { key: "tax", label: "세금", color: "#0f6e56" },
  { key: "labor", label: "급여·근로", color: "#a8325c" },
  { key: "pension", label: "연금·보험", color: "#534ab7" },
  { key: "home", label: "집·차", color: "#6e7438" },
  { key: "inherit", label: "상속·증여", color: "#a85820" },
  { key: "money", label: "돈·금융", color: "#0b5cad" },
  { key: "date", label: "날짜·시간", color: "#2e7d9a" },
  { key: "media", label: "사진·문서", color: "#b07a12" },
  { key: "text", label: "텍스트·개발", color: "#3d4a5c" },
  { key: "unit", label: "단위·변환", color: "#1f9c8e" },
  { key: "health", label: "건강·운동", color: "#d0563b" },
  { key: "life", label: "생활·재미", color: "#8a6fd1" },
] as const;

export type ToolType = (typeof TOOL_TYPES)[number]["key"];

const CLUSTER_TYPE: Record<string, ToolType> = {
  income: "tax", vat: "tax", labor: "labor", retirement: "pension", localtax: "home", inheritance: "inherit",
};

export function typeOfCluster(id: string): ToolType {
  const t = CLUSTER_TYPE[id];
  if (!t) throw new Error(`분류 없는 클러스터: ${id}`);
  return t;
}

export const typeInfo = (k: ToolType) => TOOL_TYPES.find((t) => t.key === k)!;
