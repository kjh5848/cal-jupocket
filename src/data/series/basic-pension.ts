/**
 * 기초연금 시리즈 — 2026-10-14. v39 에서 1천 회당 광고 클릭이 가장 진한 묶음(14.9).
 * 기초연금 금액 13,880(226) · 모의계산 10,320 · 기준 7,770(256) · 신청 5,830(108) · 수급자격 재산 1,620 · 나이 1,600 · 노령연금 차이 1,130.
 * 근거: 기초연금법 제2조~제8조·제10조·제14조·제16조~제18조, 시행령 제10조·제11조·제13조, 시행규칙 제4조·제6조~제8조, 보건복지부고시 제2026-156호.
 */
import type { Series } from "./types";

export const basicPensionSeries: Series = {
  id: "basic-pension",
  cluster: "retirement",
  hub: { slug: "basic-pension", keyword: "기초연금", label: "기초연금 — 65세·월 349,700원" },
  items: [
    { slug: "basic-pension-amount", keyword: "기초연금 금액", label: "기초연금 금액·부부·국민연금" },
    { slug: "basic-pension-criteria", keyword: "기초연금 기준", label: "기초연금 기준·소득인정액" },
    { slug: "basic-pension-calculator", keyword: "기초연금 모의계산", label: "기초연금 모의계산" },
    { slug: "basic-pension-apply", keyword: "기초연금 신청", label: "기초연금 신청·서류" },
  ],
};
