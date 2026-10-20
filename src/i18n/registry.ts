/// <reference types="vite/client" />
/**
 * 나라판 도구 목록 모음 — src/data/<판>/tools.ts 를 전부 읽는다(판 = src/i18n/locales.ts 의 locale, 예: ja · en-us).
 *
 * 나라 루틴은 자기 판 폴더의 tools.ts 에만 한 줄을 더한다. 짝(hreflang)도 그 줄의 `ko` 칸에서 나온다 —
 * 가운데 목록 하나에 여러 루틴이 줄을 더하면 동시에 돌 때 git 충돌이 나서 이렇게 나눴다(2026-10-20).
 */
import type { ToolType } from "../data/tool-types";
import { LOCALES, type Locale } from "./locales";

export interface LocaleTool {
  href: string;
  name: string;
  blurb: string;
  type: ToolType;
  icon: string;
  /** "math" 는 산술(나라 무관), "law" 는 그 나라 원문으로 검증한 제도 */
  basis: "math" | "law";
  /**
   * 계산이 같은 한국어판 주소 — 있으면 서로 hreflang 짝이 된다.
   * 제도가 다른 페이지(한국 상속세 ↔ 일본 相続税)에는 적지 않는다. 같은 주제라도 서로의 번역판이 아니다.
   */
  ko?: string;
}

const mods = import.meta.glob<{ tools: LocaleTool[] }>("../data/*/tools.ts", { eager: true });

export const toolsByLocale: Partial<Record<Locale, LocaleTool[]>> = {};
for (const [path, mod] of Object.entries(mods)) {
  const folder = path.split("/").at(-2) as Locale;
  if (LOCALES.includes(folder) && Array.isArray(mod.tools)) toolsByLocale[folder] = mod.tools;
}

export const toolsOf = (l: Locale): LocaleTool[] => toolsByLocale[l] ?? [];

/** 홈이 있는 판 — src/pages/<접두어>/index.astro 가 있으면 열린 판이다 */
const homes = import.meta.glob("../pages/*/index.astro");
export const openLocales: Locale[] = [
  "ko",
  ...LOCALES.filter((l) => l !== "ko" && Object.keys(homes).some((p) => p === `../pages/${l}/index.astro`)),
];
