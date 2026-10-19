/**
 * 화면 문구 사전 — 한국어판과 일본어판(/ja/)이 같이 쓰는 틀의 말(메뉴·버튼·안내).
 *
 * 글·계산기 본문은 여기 두지 않는다. 일본어판은 번역이 아니라 일본 제도·검색어로
 * 새로 쓰는 페이지라(2026-10-19 일본어판 기초 설계 2절), 페이지마다 자기 문장을 갖는다.
 * 여기 있는 것은 어느 페이지에서나 같은 자리의 같은 말뿐이다.
 *
 * 언어는 주소로 정한다 — /ja/ 아래면 일본어, 나머지는 한국어. 쿠키·브라우저 언어로
 * 바꾸지 않는다: 같은 주소가 사람마다 다른 말을 내면 검색엔진이 어느 쪽도 못 믿는다.
 */
export type Locale = "ko" | "ja";

export const LOCALES: Locale[] = ["ko", "ja"];

export function localeOf(path: string): Locale {
  return path === "/ja" || path.startsWith("/ja/") ? "ja" : "ko";
}

export const UI = {
  ko: {
    htmlLang: "ko",
    ogLocale: "ko_KR",
    brand: "주포켓",
    home: "/",
    homeLabel: "주포켓 홈",
    navLabel: "주요 메뉴",
    navTools: "도구",
    navReads: "읽을거리",
    navCards: "카드뉴스",
    langName: "한국어",
    langSwitch: "한국어로 보기",
    footerNote:
      "이 사이트의 계산 결과는 참고용 예상치이며 법적 효력이 없습니다. 정확한 세액은 홈택스 또는 세무 전문가를 통해 확인하세요.",
    footerCopy: "주포켓 계산기",
    privacy: "개인정보처리방침",
    themeLabel: { light: "라이트", dark: "다크", system: "기기 설정 따름" },
    themeAria: (cur: string, next: string) => `화면 테마: ${cur} (누르면 ${next})`,
    presetsAria: "자주 넣는 금액",
    stepDown: "줄이기",
    stepUp: "늘리기",
    resultFallback: "결과",
    dockMore: "자세히 ↓",
    copy: "결과 복사",
    copied: "복사했어요",
    copyFailed: "복사 안 됨",
    reset: "처음 값으로",
    collectedStamp: "써봄",
    collected: "주머니에 담겼어요",
    collectedLink: "도구 도감 보기",
    collectedHref: "/#tools",
    numberLocale: "ko-KR",
  },
  ja: {
    htmlLang: "ja",
    ogLocale: "ja_JP",
    // 일본어판 이름은 사람이 정한다(브랜드 결정). 정해지기 전까지 도메인 표기를 쓴다.
    brand: "jupocket",
    home: "/ja/",
    homeLabel: "jupocket ホーム",
    navLabel: "メインメニュー",
    navTools: "ツール",
    navReads: "読みもの",
    navCards: "",
    langName: "日本語",
    langSwitch: "日本語で見る",
    footerNote:
      "計算結果は目安であり、法的な効力はありません。正確な金額は国税庁・年金事務所などの公式窓口や税理士にご確認ください。",
    footerCopy: "jupocket",
    privacy: "プライバシーポリシー（韓国語）",
    themeLabel: { light: "ライト", dark: "ダーク", system: "端末の設定" },
    themeAria: (cur: string, next: string) => `画面テーマ：${cur}（押すと${next}）`,
    presetsAria: "よく使う金額",
    stepDown: "減らす",
    stepUp: "増やす",
    resultFallback: "結果",
    dockMore: "詳しく ↓",
    copy: "結果をコピー",
    copied: "コピーしました",
    copyFailed: "コピーできません",
    reset: "初期値に戻す",
    collectedStamp: "使った",
    collected: "ポケットに入りました",
    collectedLink: "ツール一覧を見る",
    collectedHref: "/ja/#tools",
    numberLocale: "ja-JP",
  },
} as const;

export type UiStrings = (typeof UI)[Locale];

export const ui = (locale: Locale): UiStrings => UI[locale];

/** 브라우저 쪽 스크립트용 — 페이지의 <html lang> 을 읽는다(서버가 주소로 이미 정했다). */
export function pageLocale(doc: Document = document): Locale {
  return doc.documentElement.lang === "ja" ? "ja" : "ko";
}
