/**
 * 화면 문구 사전 — 모든 나라판이 같이 쓰는 틀의 말(메뉴·버튼·안내·홈 머리말).
 *
 * 글·계산기 본문은 여기 두지 않는다. 나라판은 번역이 아니라 그 나라 제도·검색어로 새로 쓰는
 * 페이지라(docs/superpowers/plans/2026-10-20-country-routine.md), 페이지마다 자기 문장을 갖는다.
 * 여기 있는 것은 어느 페이지에서나 같은 자리의 같은 말뿐이다.
 *
 * 말은 언어(Lang)마다 한 벌, 나라마다 다른 것(공식 기관 이름이 들어간 면책 문구·언어 이름)만 나라별로 덮는다.
 * 한국어 말을 바꾸면 한국어판 전체가 바뀐다 — 일본어판 기초(2026-10-19) 전의 말과 같게 유지한다.
 */
import type { ToolType } from "../data/tool-types";
import { LOCALE_META, meta, localeOf, localeOfHtmlLang, LOCALES, type Locale, type Lang } from "./locales";

export { localeOf, LOCALES, type Locale };

interface Words {
  brand: string;
  homeLabel: string;
  navLabel: string;
  navTools: string;
  navReads: string;
  navCards: string;
  langName: string;
  langSwitch: string;
  /** 언어판이 여럿일 때 메뉴 이름 */
  langMenu: string;
  footerNote: string;
  footerCopy: string;
  privacy: string;
  themeLabel: { light: string; dark: string; system: string };
  themeAria: (cur: string, next: string) => string;
  presetsAria: string;
  stepDown: string;
  stepUp: string;
  resultFallback: string;
  dockMore: string;
  copy: string;
  copied: string;
  copyFailed: string;
  reset: string;
  collectedStamp: string;
  collected: string;
  collectedLink: string;
  typeLabel: Record<ToolType, string>;
  homeTitle: string;
  homeDescription: string;
  homeH1: string;
  homeLede: string;
  toolsHeading: string;
}

const WORDS: Record<Lang, Words> = {
  ko: {
    brand: "주포켓",
    homeLabel: "주포켓 홈",
    navLabel: "주요 메뉴",
    navTools: "도구",
    navReads: "읽을거리",
    navCards: "카드뉴스",
    langName: "한국어",
    langSwitch: "한국어로 보기",
    langMenu: "언어",
    footerNote:
      "이 사이트의 계산 결과는 참고용 예상치이며 법적 효력이 없습니다. 정확한 세액은 홈택스 또는 세무 전문가를 통해 확인하세요.",
    footerCopy: "주포켓 계산기",
    privacy: "개인정보처리방침",
    themeLabel: { light: "라이트", dark: "다크", system: "기기 설정 따름" },
    themeAria: (cur, next) => `화면 테마: ${cur} (누르면 ${next})`,
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
    typeLabel: { tax: "세금", labor: "급여·근로", pension: "연금·보험", home: "집·차", inherit: "상속·증여", money: "돈·금융", date: "날짜·시간", media: "사진·문서", text: "텍스트·개발", unit: "단위·변환", health: "건강·운동", life: "생활·재미" },
    // 한국어 홈은 src/pages/index.astro 가 자기 문구를 쓴다(LocaleHome 을 쓰지 않음)
    homeTitle: "",
    homeDescription: "",
    homeH1: "",
    homeLede: "",
    toolsHeading: "도구 도감",
  },
  ja: {
    // 일본어판 이름은 사람이 정한다(브랜드 결정). 정해지기 전까지 도메인 표기를 쓴다.
    brand: "jupocket",
    homeLabel: "jupocket ホーム",
    navLabel: "メインメニュー",
    navTools: "ツール",
    navReads: "読みもの",
    navCards: "",
    langName: "日本語",
    langSwitch: "日本語で見る",
    langMenu: "言語",
    footerNote:
      "計算結果は目安であり、法的な効力はありません。正確な金額は国税庁・年金事務所などの公式窓口や税理士にご確認ください。",
    footerCopy: "jupocket",
    privacy: "プライバシーポリシー（韓国語）",
    themeLabel: { light: "ライト", dark: "ダーク", system: "端末の設定" },
    themeAria: (cur, next) => `画面テーマ：${cur}（押すと${next}）`,
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
    typeLabel: { tax: "税金", labor: "給与・労働", pension: "年金・保険", home: "住まい・車", inherit: "相続・贈与", money: "お金・金融", date: "日付・時間", media: "写真・文書", text: "テキスト・開発", unit: "単位・換算", health: "健康・運動", life: "くらし" },
    homeTitle: "jupocket — 計算ツールをまとめたポケット",
    homeDescription:
      "パーセント・割引・日付などの計算ツールを集めたサイトです。税金や年金のツールは、国税庁などの公式情報で確かめたものから順に追加します。",
    homeH1: "何を計算しますか？",
    homeLede:
      "よく使う計算をすぐ使えるツールにしました。税金・年金のツールは、国税庁・日本年金機構などの公式情報で数字を確かめたものから追加していきます。",
    toolsHeading: "ツール",
  },
  en: {
    brand: "jupocket",
    homeLabel: "jupocket home",
    navLabel: "Main menu",
    navTools: "Tools",
    navReads: "Guides",
    navCards: "",
    langName: "English",
    langSwitch: "View in English",
    langMenu: "Language",
    footerNote:
      "Results are estimates for reference only and have no legal effect. Check exact amounts with the official tax authority or a qualified tax professional.",
    footerCopy: "jupocket",
    privacy: "Privacy policy (Korean)",
    themeLabel: { light: "Light", dark: "Dark", system: "Device setting" },
    themeAria: (cur, next) => `Theme: ${cur} (click for ${next})`,
    presetsAria: "Common amounts",
    stepDown: "Decrease",
    stepUp: "Increase",
    resultFallback: "Result",
    dockMore: "Details ↓",
    copy: "Copy result",
    copied: "Copied",
    copyFailed: "Couldn’t copy",
    reset: "Reset",
    collectedStamp: "Used",
    collected: "Added to your pocket",
    collectedLink: "See all tools",
    typeLabel: { tax: "Tax", labor: "Pay & work", pension: "Pension & insurance", home: "Home & car", inherit: "Estate & gifts", money: "Money & finance", date: "Dates & time", media: "Photos & files", text: "Text & dev", unit: "Units & conversion", health: "Health & fitness", life: "Everyday" },
    homeTitle: "jupocket — a pocket of everyday calculators",
    homeDescription:
      "Percentage, date and money calculators in one place. Tax and payroll tools are added only after their figures are checked against official government sources.",
    homeH1: "What do you need to work out?",
    homeLede:
      "Everyday calculations, ready to use. Tax and payroll tools are added one by one, each checked against the official government source first.",
    toolsHeading: "Tools",
  },
  de: {
    brand: "jupocket",
    homeLabel: "jupocket Startseite",
    navLabel: "Hauptmenü",
    navTools: "Rechner",
    navReads: "Ratgeber",
    navCards: "",
    langName: "Deutsch",
    langSwitch: "Auf Deutsch ansehen",
    langMenu: "Sprache",
    footerNote:
      "Die Ergebnisse sind unverbindliche Schätzungen ohne rechtliche Wirkung. Genaue Beträge erfahren Sie beim Finanzamt oder bei einer Steuerberaterin bzw. einem Steuerberater.",
    footerCopy: "jupocket",
    privacy: "Datenschutzerklärung (Koreanisch)",
    themeLabel: { light: "Hell", dark: "Dunkel", system: "Gerätestandard" },
    themeAria: (cur, next) => `Design: ${cur} (klicken für ${next})`,
    presetsAria: "Häufige Beträge",
    stepDown: "Verringern",
    stepUp: "Erhöhen",
    resultFallback: "Ergebnis",
    dockMore: "Details ↓",
    copy: "Ergebnis kopieren",
    copied: "Kopiert",
    copyFailed: "Kopieren nicht möglich",
    reset: "Zurücksetzen",
    collectedStamp: "Genutzt",
    collected: "In die Tasche gesteckt",
    collectedLink: "Alle Rechner",
    typeLabel: { tax: "Steuern", labor: "Lohn & Arbeit", pension: "Rente & Versicherung", home: "Wohnen & Auto", inherit: "Erbe & Schenkung", money: "Geld & Finanzen", date: "Datum & Zeit", media: "Fotos & Dokumente", text: "Text & Entwicklung", unit: "Einheiten", health: "Gesundheit", life: "Alltag" },
    homeTitle: "jupocket — Rechner für den Alltag",
    homeDescription:
      "Prozent-, Datums- und Geldrechner an einem Ort. Steuer- und Lohnrechner kommen erst hinzu, wenn ihre Zahlen anhand amtlicher Quellen geprüft sind.",
    homeH1: "Was möchten Sie berechnen?",
    homeLede:
      "Alltägliche Rechnungen, sofort nutzbar. Steuer- und Lohnrechner ergänzen wir nach und nach – jeweils erst nach Prüfung an der amtlichen Quelle.",
    toolsHeading: "Rechner",
  },
  fr: {
    brand: "jupocket",
    homeLabel: "Accueil jupocket",
    navLabel: "Menu principal",
    navTools: "Outils",
    navReads: "Guides",
    navCards: "",
    langName: "Français",
    langSwitch: "Voir en français",
    langMenu: "Langue",
    footerNote:
      "Les résultats sont des estimations indicatives sans valeur juridique. Vérifiez les montants exacts auprès de l’administration fiscale ou d’un professionnel.",
    footerCopy: "jupocket",
    privacy: "Politique de confidentialité (en coréen)",
    themeLabel: { light: "Clair", dark: "Sombre", system: "Réglage de l’appareil" },
    themeAria: (cur, next) => `Thème : ${cur} (cliquer pour ${next})`,
    presetsAria: "Montants fréquents",
    stepDown: "Diminuer",
    stepUp: "Augmenter",
    resultFallback: "Résultat",
    dockMore: "Détails ↓",
    copy: "Copier le résultat",
    copied: "Copié",
    copyFailed: "Copie impossible",
    reset: "Réinitialiser",
    collectedStamp: "Utilisé",
    collected: "Ajouté à votre poche",
    collectedLink: "Voir tous les outils",
    typeLabel: { tax: "Impôts", labor: "Salaire & travail", pension: "Retraite & assurance", home: "Logement & auto", inherit: "Succession & donation", money: "Argent & finance", date: "Dates & heures", media: "Photos & documents", text: "Texte & dev", unit: "Unités", health: "Santé & sport", life: "Vie courante" },
    homeTitle: "jupocket — des calculateurs du quotidien",
    homeDescription:
      "Calculateurs de pourcentage, de dates et d’argent réunis au même endroit. Les outils fiscaux ne sont ajoutés qu’après vérification des chiffres auprès des sources officielles.",
    homeH1: "Que voulez-vous calculer ?",
    homeLede:
      "Des calculs du quotidien, prêts à l’emploi. Les outils fiscaux et de paie arrivent un par un, chacun vérifié d’abord auprès de la source officielle.",
    toolsHeading: "Outils",
  },
  es: {
    brand: "jupocket",
    homeLabel: "Inicio de jupocket",
    navLabel: "Menú principal",
    navTools: "Herramientas",
    navReads: "Guías",
    navCards: "",
    langName: "Español",
    langSwitch: "Ver en español",
    langMenu: "Idioma",
    footerNote:
      "Los resultados son estimaciones orientativas sin efecto legal. Confirme los importes exactos con la Agencia Tributaria o con un asesor fiscal.",
    footerCopy: "jupocket",
    privacy: "Política de privacidad (en coreano)",
    themeLabel: { light: "Claro", dark: "Oscuro", system: "Ajuste del dispositivo" },
    themeAria: (cur, next) => `Tema: ${cur} (pulsa para ${next})`,
    presetsAria: "Importes frecuentes",
    stepDown: "Reducir",
    stepUp: "Aumentar",
    resultFallback: "Resultado",
    dockMore: "Detalles ↓",
    copy: "Copiar resultado",
    copied: "Copiado",
    copyFailed: "No se pudo copiar",
    reset: "Restablecer",
    collectedStamp: "Usado",
    collected: "Guardado en tu bolsillo",
    collectedLink: "Ver todas las herramientas",
    typeLabel: { tax: "Impuestos", labor: "Salario y trabajo", pension: "Pensiones y seguros", home: "Vivienda y coche", inherit: "Herencias y donaciones", money: "Dinero y finanzas", date: "Fechas y horas", media: "Fotos y documentos", text: "Texto y desarrollo", unit: "Unidades", health: "Salud y deporte", life: "Día a día" },
    homeTitle: "jupocket — calculadoras para el día a día",
    homeDescription:
      "Calculadoras de porcentajes, fechas y dinero en un solo sitio. Las herramientas fiscales solo se añaden después de comprobar sus cifras con fuentes oficiales.",
    homeH1: "¿Qué quieres calcular?",
    homeLede:
      "Cálculos cotidianos, listos para usar. Las herramientas de impuestos y nóminas se añaden una a una, cada una comprobada antes con la fuente oficial.",
    toolsHeading: "Herramientas",
  },
  "zh-Hant": {
    brand: "jupocket",
    homeLabel: "jupocket 首頁",
    navLabel: "主選單",
    navTools: "工具",
    navReads: "指南",
    navCards: "",
    langName: "繁體中文",
    langSwitch: "以繁體中文檢視",
    langMenu: "語言",
    footerNote: "計算結果僅供參考，不具法律效力。確切金額請向稅務主管機關或專業人士確認。",
    footerCopy: "jupocket",
    privacy: "隱私權政策（韓文）",
    themeLabel: { light: "淺色", dark: "深色", system: "依裝置設定" },
    themeAria: (cur, next) => `畫面主題：${cur}（點按切換為${next}）`,
    presetsAria: "常用金額",
    stepDown: "減少",
    stepUp: "增加",
    resultFallback: "結果",
    dockMore: "詳細 ↓",
    copy: "複製結果",
    copied: "已複製",
    copyFailed: "無法複製",
    reset: "恢復預設值",
    collectedStamp: "用過",
    collected: "已放進口袋",
    collectedLink: "查看所有工具",
    typeLabel: { tax: "稅務", labor: "薪資・勞動", pension: "年金・保險", home: "住宅・汽車", inherit: "遺產・贈與", money: "理財・金融", date: "日期・時間", media: "照片・文件", text: "文字・開發", unit: "單位換算", health: "健康・運動", life: "生活" },
    homeTitle: "jupocket — 日常計算工具",
    homeDescription: "百分比、日期、金額等計算工具一次備齊。稅務與薪資工具會先以官方資料核對數字後再陸續加入。",
    homeH1: "想算什麼？",
    homeLede: "常用的計算，打開就能用。稅務與薪資工具會逐一加入，每一項都先以官方資料核對。",
    toolsHeading: "工具",
  },
  "zh-Hans": {
    brand: "jupocket",
    homeLabel: "jupocket 首页",
    navLabel: "主菜单",
    navTools: "工具",
    navReads: "指南",
    navCards: "",
    langName: "简体中文",
    langSwitch: "以简体中文查看",
    langMenu: "语言",
    footerNote: "计算结果仅供参考，不具法律效力。准确金额请向税务机关或专业人士确认。",
    footerCopy: "jupocket",
    privacy: "隐私政策（韩文）",
    themeLabel: { light: "浅色", dark: "深色", system: "跟随设备" },
    themeAria: (cur, next) => `界面主题：${cur}（点击切换为${next}）`,
    presetsAria: "常用金额",
    stepDown: "减少",
    stepUp: "增加",
    resultFallback: "结果",
    dockMore: "详细 ↓",
    copy: "复制结果",
    copied: "已复制",
    copyFailed: "无法复制",
    reset: "恢复默认值",
    collectedStamp: "用过",
    collected: "已放进口袋",
    collectedLink: "查看全部工具",
    typeLabel: { tax: "税务", labor: "工资・劳动", pension: "养老金・保险", home: "住房・汽车", inherit: "遗产・赠与", money: "理财・金融", date: "日期・时间", media: "照片・文档", text: "文本・开发", unit: "单位换算", health: "健康・运动", life: "生活" },
    homeTitle: "jupocket — 日常计算工具",
    homeDescription: "百分比、日期、金额等计算工具集中在一处。税务与工资工具会先以官方资料核对数字后再陆续加入。",
    homeH1: "想算什么？",
    homeLede: "常用的计算，打开就能用。税务与工资工具会逐一加入，每一项都先以官方资料核对。",
    toolsHeading: "工具",
  },
  id: {
    brand: "jupocket",
    homeLabel: "Beranda jupocket",
    navLabel: "Menu utama",
    navTools: "Alat",
    navReads: "Panduan",
    navCards: "",
    langName: "Bahasa Indonesia",
    langSwitch: "Lihat dalam Bahasa Indonesia",
    langMenu: "Bahasa",
    footerNote:
      "Hasil perhitungan hanya perkiraan dan tidak memiliki kekuatan hukum. Pastikan jumlah pastinya ke Direktorat Jenderal Pajak atau konsultan pajak.",
    footerCopy: "jupocket",
    privacy: "Kebijakan privasi (bahasa Korea)",
    themeLabel: { light: "Terang", dark: "Gelap", system: "Ikuti perangkat" },
    themeAria: (cur, next) => `Tema: ${cur} (klik untuk ${next})`,
    presetsAria: "Jumlah yang sering dipakai",
    stepDown: "Kurangi",
    stepUp: "Tambah",
    resultFallback: "Hasil",
    dockMore: "Detail ↓",
    copy: "Salin hasil",
    copied: "Tersalin",
    copyFailed: "Gagal menyalin",
    reset: "Atur ulang",
    collectedStamp: "Dipakai",
    collected: "Masuk ke saku",
    collectedLink: "Lihat semua alat",
    typeLabel: { tax: "Pajak", labor: "Gaji & kerja", pension: "Pensiun & asuransi", home: "Rumah & mobil", inherit: "Waris & hibah", money: "Uang & keuangan", date: "Tanggal & waktu", media: "Foto & dokumen", text: "Teks & dev", unit: "Satuan", health: "Kesehatan", life: "Sehari-hari" },
    homeTitle: "jupocket — kalkulator sehari-hari",
    homeDescription:
      "Kalkulator persentase, tanggal, dan uang di satu tempat. Alat pajak dan gaji ditambahkan setelah angkanya dicek dengan sumber resmi pemerintah.",
    homeH1: "Mau menghitung apa?",
    homeLede:
      "Perhitungan sehari-hari yang langsung bisa dipakai. Alat pajak dan gaji ditambahkan satu per satu, masing-masing dicek dulu dengan sumber resmi.",
    toolsHeading: "Alat",
  },
};

/** 나라마다 다른 말 — 언어 이름과, 공식 기관 이름이 들어간 면책 문구 */
const OVERRIDES: Partial<Record<Locale, Partial<Words>>> = {
  "en-us": { langName: "English (US)", footerNote: "Results are estimates for reference only and have no legal effect. Check exact amounts with the IRS, your state agency or a qualified tax professional." },
  "en-gb": { langName: "English (UK)", footerNote: "Results are estimates for reference only and have no legal effect. Check exact amounts with HMRC (GOV.UK) or a qualified tax adviser." },
  "en-ca": { langName: "English (Canada)", footerNote: "Results are estimates for reference only and have no legal effect. Check exact amounts with the Canada Revenue Agency or a qualified tax professional." },
  "en-au": { langName: "English (Australia)", footerNote: "Results are estimates for reference only and have no legal effect. Check exact amounts with the Australian Taxation Office or a registered tax agent." },
  "en-sg": { langName: "English (Singapore)", footerNote: "Results are estimates for reference only and have no legal effect. Check exact amounts with IRAS or a qualified tax professional." },
  "zh-tw": { langName: "繁體中文（台灣）", footerNote: "計算結果僅供參考，不具法律效力。確切金額請向財政部或稅務專業人士確認。" },
  "zh-hk": { langName: "繁體中文（香港）", footerNote: "計算結果僅供參考，不具法律效力。確切金額請向稅務局或專業人士確認。" },
};

export type UiStrings = Words & {
  locale: Locale;
  htmlLang: string;
  ogLocale: string;
  /** 그 판의 홈 주소 */
  home: string;
  collectedHref: string;
  numberLocale: string;
  currency: string;
  /** 계산기 틀의 금액 읽기 단위 — 네 자리(만·万) 단위가 있는 원·円 만. 나머지 판은 "" */
  wonUnit: string;
};

export function ui(locale: Locale): UiStrings {
  const m = meta(locale);
  return {
    ...WORDS[m.lang],
    ...OVERRIDES[locale],
    locale,
    htmlLang: m.htmlLang,
    ogLocale: m.ogLocale,
    home: m.prefix,
    collectedHref: `${m.prefix}#tools`,
    numberLocale: m.numberLocale,
    currency: m.currency,
    wonUnit: locale === "ko" ? "원" : locale === "ja" ? "円" : "",
  };
}

/** 모든 판의 사전(테스트용) */
export const UI = Object.fromEntries(LOCALE_META.map((m) => [m.locale, ui(m.locale)])) as Record<Locale, UiStrings>;

/** 금액 표기 — 원·円 은 숫자 뒤 단위, 나머지는 그 나라 통화 형식 */
export function formatMoney(locale: Locale, n: number): string {
  const T = ui(locale);
  if (T.wonUnit) return n.toLocaleString(T.numberLocale) + T.wonUnit;
  return new Intl.NumberFormat(T.numberLocale, { style: "currency", currency: T.currency }).format(n);
}

/** 브라우저 쪽 스크립트용 — 페이지의 <html lang> 을 읽는다(서버가 주소로 이미 정했다). */
export function pageLocale(doc: Document = document): Locale {
  return localeOfHtmlLang(doc.documentElement.lang);
}

/**
 * 공유 계산기 스크립트의 문구 고르기 — 산술 도구는 한 스크립트를 여러 판이 같이 쓴다.
 * 언어별 사전을 넘기면 이 페이지 언어의 것을, 없으면 한국어(ko)를 준다. 영어 다섯 나라는 en 하나를 같이 쓴다.
 *   const S = pickLang({ ko: KO, ja: JA, en: EN });
 */
export function pickLang<D>(dicts: Partial<Record<Lang, D>> & { ko: D }, doc: Document = document): D {
  const lang = meta(pageLocale(doc)).lang;
  return dicts[lang] ?? dicts.ko;
}
