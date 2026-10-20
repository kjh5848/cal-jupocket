/**
 * 나라별 판 — 주소 접두어 · 언어 표기 · 통화. 나라 하나가 판 하나다(같은 영어라도 미국판과 영국판은 법이 달라 따로).
 *
 * 언어는 주소로 정한다. 쿠키·브라우저 언어로 바꾸지 않는다 — 같은 주소가 사람마다 다른 말을 내면
 * 검색엔진이 어느 쪽도 못 믿는다.
 *
 * column 은 docs/country-matrix.md 의 나라 칸 이름이다. 나라 루틴(docs/superpowers/plans/2026-10-20-country-routine.md)이
 * 이 칸을 읽고 docs/countries/<code>.md 에 기록한다.
 */
export type Locale =
  | "ko"
  | "ja"
  | "en-us"
  | "en-gb"
  | "en-ca"
  | "en-au"
  | "en-sg"
  | "de"
  | "fr"
  | "es"
  | "zh-tw"
  | "zh-hk"
  | "zh-cn"
  | "id";

/** 화면 말의 언어 — 영어 다섯 나라는 한 사전을 같이 쓴다 */
export type Lang = "ko" | "ja" | "en" | "de" | "fr" | "es" | "zh-Hant" | "zh-Hans" | "id";

export interface LocaleMeta {
  locale: Locale;
  /** 주소 접두어. 한국어판만 "/" */
  prefix: string;
  lang: Lang;
  /** <html lang> — BCP 47 */
  htmlLang: string;
  /** <link rel="alternate" hreflang> */
  hreflang: string;
  ogLocale: string;
  /** Intl 숫자·통화 형식 */
  numberLocale: string;
  currency: string;
  /** 조사표(docs/country-matrix.md) 칸 이름 */
  column: string;
  /** 나라 기록 파일 docs/countries/<code>.md */
  code: string;
}

export const LOCALE_META: LocaleMeta[] = [
  { locale: "ko", prefix: "/", lang: "ko", htmlLang: "ko", hreflang: "ko", ogLocale: "ko_KR", numberLocale: "ko-KR", currency: "KRW", column: "한국", code: "kr" },
  { locale: "ja", prefix: "/ja/", lang: "ja", htmlLang: "ja", hreflang: "ja", ogLocale: "ja_JP", numberLocale: "ja-JP", currency: "JPY", column: "일본", code: "jp" },
  { locale: "en-us", prefix: "/en-us/", lang: "en", htmlLang: "en-US", hreflang: "en-US", ogLocale: "en_US", numberLocale: "en-US", currency: "USD", column: "미국", code: "us" },
  { locale: "en-gb", prefix: "/en-gb/", lang: "en", htmlLang: "en-GB", hreflang: "en-GB", ogLocale: "en_GB", numberLocale: "en-GB", currency: "GBP", column: "영국", code: "gb" },
  { locale: "en-ca", prefix: "/en-ca/", lang: "en", htmlLang: "en-CA", hreflang: "en-CA", ogLocale: "en_CA", numberLocale: "en-CA", currency: "CAD", column: "캐나다", code: "ca" },
  { locale: "en-au", prefix: "/en-au/", lang: "en", htmlLang: "en-AU", hreflang: "en-AU", ogLocale: "en_AU", numberLocale: "en-AU", currency: "AUD", column: "호주", code: "au" },
  { locale: "en-sg", prefix: "/en-sg/", lang: "en", htmlLang: "en-SG", hreflang: "en-SG", ogLocale: "en_SG", numberLocale: "en-SG", currency: "SGD", column: "싱가포르", code: "sg" },
  { locale: "de", prefix: "/de/", lang: "de", htmlLang: "de-DE", hreflang: "de-DE", ogLocale: "de_DE", numberLocale: "de-DE", currency: "EUR", column: "독일", code: "de" },
  { locale: "fr", prefix: "/fr/", lang: "fr", htmlLang: "fr-FR", hreflang: "fr-FR", ogLocale: "fr_FR", numberLocale: "fr-FR", currency: "EUR", column: "프랑스", code: "fr" },
  { locale: "es", prefix: "/es/", lang: "es", htmlLang: "es-ES", hreflang: "es-ES", ogLocale: "es_ES", numberLocale: "es-ES", currency: "EUR", column: "스페인", code: "es" },
  { locale: "zh-tw", prefix: "/zh-tw/", lang: "zh-Hant", htmlLang: "zh-Hant-TW", hreflang: "zh-TW", ogLocale: "zh_TW", numberLocale: "zh-TW", currency: "TWD", column: "대만", code: "tw" },
  { locale: "zh-hk", prefix: "/zh-hk/", lang: "zh-Hant", htmlLang: "zh-Hant-HK", hreflang: "zh-HK", ogLocale: "zh_HK", numberLocale: "zh-HK", currency: "HKD", column: "홍콩", code: "hk" },
  { locale: "zh-cn", prefix: "/zh-cn/", lang: "zh-Hans", htmlLang: "zh-Hans-CN", hreflang: "zh-CN", ogLocale: "zh_CN", numberLocale: "zh-CN", currency: "CNY", column: "중국", code: "cn" },
  { locale: "id", prefix: "/id/", lang: "id", htmlLang: "id-ID", hreflang: "id-ID", ogLocale: "id_ID", numberLocale: "id-ID", currency: "IDR", column: "인도네시아", code: "id" },
];

export const LOCALES: Locale[] = LOCALE_META.map((m) => m.locale);

export const meta = (l: Locale): LocaleMeta => LOCALE_META.find((m) => m.locale === l)!;

/** 주소 → 판. 한국어판(접두어 "/")이 아닌 판의 접두어로 시작하면 그 판 */
export function localeOf(path: string): Locale {
  const hit = LOCALE_META.find((m) => m.prefix !== "/" && (path.startsWith(m.prefix) || path === m.prefix.slice(0, -1)));
  return hit ? hit.locale : "ko";
}

/** <html lang> → 판(브라우저 쪽 스크립트용) */
export function localeOfHtmlLang(htmlLang: string): Locale {
  return LOCALE_META.find((m) => m.htmlLang === htmlLang)?.locale ?? "ko";
}
