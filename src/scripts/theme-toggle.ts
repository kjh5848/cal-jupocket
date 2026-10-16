/** 헤더 테마 버튼 — 누르면 다음 테마로, 저장이 막혀도 이번 화면에는 적용. */
import { readTheme, writeTheme, nextTheme, applyTheme, type ThemeChoice } from "../lib/theme";

const LABEL: Record<ThemeChoice, string> = { light: "라이트", dark: "다크", system: "기기 설정 따름" };

for (const btn of document.querySelectorAll<HTMLButtonElement>(".theme-toggle")) {
  let cur = readTheme();
  const paint = () => {
    btn.dataset.state = cur;
    btn.setAttribute("aria-label", `화면 테마: ${LABEL[cur]} (누르면 ${LABEL[nextTheme(cur)]})`);
  };
  paint();
  btn.addEventListener("click", () => {
    cur = nextTheme(cur);
    writeTheme(cur);
    applyTheme(cur);
    paint();
  });
}
