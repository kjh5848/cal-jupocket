/** 헤더 테마 버튼 — 누르면 다음 테마로, 저장이 막혀도 이번 화면에는 적용. */
import { readTheme, writeTheme, nextTheme, applyTheme } from "../lib/theme";
import { ui, pageLocale } from "../i18n/ui";

const T = ui(pageLocale());
const LABEL = T.themeLabel;

for (const btn of document.querySelectorAll<HTMLButtonElement>(".theme-toggle")) {
  let cur = readTheme();
  const paint = () => {
    btn.dataset.state = cur;
    btn.setAttribute("aria-label", T.themeAria(LABEL[cur], LABEL[nextTheme(cur)]));
  };
  paint();
  btn.addEventListener("click", () => {
    cur = nextTheme(cur);
    writeTheme(cur);
    applyTheme(cur);
    paint();
  });
}
