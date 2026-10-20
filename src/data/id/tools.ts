/**
 * 인도네시아어판(/id/) 도구 목록. 한국어판 도감(src/data/tools.ts)과 따로 둔다 —
 * 인도네시아판에는 산술 도구와 인도네시아 원문(설정의 허용 출처: pajak.go.id·peraturan.bpk.go.id 등)으로 검증한 제도 도구만 들어온다.
 *
 * 새 페이지를 만들면 여기 한 줄. 계산이 같은 한국어판이 있으면 `ko` 에 그 주소 → hreflang 짝.
 * basis 는 "math"(산술, 나라 무관) 또는 "law"(인도네시아 원문으로 검증한 제도). 형식은 src/i18n/registry.ts.
 */
import type { LocaleTool } from "../../i18n/registry";

export const tools: LocaleTool[] = [
  {
    href: "/id/tools/percent/",
    ko: "/tools/percent/",
    name: "Kalkulator Persen",
    blurb: "Persen dari sebuah angka, persentase kenaikan atau penurunan, dan harga setelah diskon",
    type: "unit",
    icon: "percent",
    basis: "math",
  },
  {
    href: "/id/tools/date-diff/",
    ko: "/tools/date-diff/",
    name: "Kalkulator Tanggal",
    blurb: "Jumlah hari antara dua tanggal, tambah atau mundurkan tanggal, dan hari Senin–Jumat dalam sebuah rentang",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/id/tools/compound/",
    ko: "/tools/compound/",
    name: "Kalkulator Bunga Majemuk",
    blurb: "Modal awal plus setoran bulanan dengan asumsi imbal hasil — total bunga, setelah pajak dan inflasi, per tahun",
    type: "money",
    icon: "chart",
    basis: "math",
  },
  {
    href: "/id/tools/dday/",
    ko: "/tools/dday/",
    name: "Hitung Mundur Hari",
    blurb: "Berapa hari lagi menuju tanggal tujuan — sisa hari, jam, dan menit, juga hari ke berapa dari tanggal awal",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/id/tools/unix-time/",
    ko: "/tools/unix-time/",
    name: "Konversi Unix Timestamp",
    blurb: "Unix timestamp detik atau milidetik ke tanggal dan jam UTC atau zona waktu perangkat, dan tanggal kembali ke epoch time",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
  {
    href: "/id/tools/sec-convert/",
    ko: "/tools/sec-convert/",
    name: "Konversi Detik, Menit, Jam",
    blurb: "Detik ke menit, jam dan hari sekaligus, jam:menit:detik, jam desimal untuk rekap jam kerja, dan milidetik",
    type: "date",
    icon: "calendar",
    basis: "math",
  },
];
