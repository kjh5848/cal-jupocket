/**
 * 테마 선택 — 라이트 / 다크 / 기기 설정(system). 설계 6-5.
 * 저장은 localStorage 'jp-theme'. 막혀 있거나 이상한 값이면 기기 설정을 따른다.
 * 첫 그림 전 적용은 BaseHead 의 인라인 스크립트가 같은 규칙으로 한다(여기 코드를 못 불러오는 시점이라).
 */
export type ThemeChoice = "light" | "dark" | "system";
export const THEME_KEY = "jp-theme";
const ORDER: ThemeChoice[] = ["light", "dark", "system"];

const defaultStore = (): Storage | null => {
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
};

export function readTheme(store: Storage | null = defaultStore()): ThemeChoice {
  try {
    const v = store?.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch { return "system"; }
}

export function writeTheme(c: ThemeChoice, store: Storage | null = defaultStore()): boolean {
  try { if (!store) return false; store.setItem(THEME_KEY, c); return true; } catch { return false; }
}

export function nextTheme(c: ThemeChoice): ThemeChoice {
  return ORDER[(ORDER.indexOf(c) + 1) % ORDER.length];
}

export function applyTheme(c: ThemeChoice, root: HTMLElement = document.documentElement): void {
  if (c === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", c);
}
