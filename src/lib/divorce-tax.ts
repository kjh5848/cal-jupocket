/**
 * 이혼 재산분할 취득세 — 지방세법 제15조 제1항 제6호.
 *
 *   취득세       과세표준 × (무상취득 3.5% − 중과기준세율 2%) = 1.5%
 *   지방교육세   과세표준 × (3.5% − 2%) × 20% = 0.3%            제151조 ① 1호
 *   비교         같은 무상취득을 특례 없이 하면 3.5% + 0.3%
 *
 * 법은 '제11조 세율 − 2%'만 정했다. 재산분할을 무상취득(3.5%)으로 다루는 근거는
 * 시행령 제28조의6 ② 2호(무상취득 중과에서 재산분할 특례 대상 제외)다 — rates 의 baseRateWhy.
 * 농어촌특별세는 계산하지 않는다(notVerified).
 */
import r from "../rates/divorce-2026.json";

const A = r.acquisition;
const fl = (v: number) => Math.floor(v + 1e-6);

/** 재산분할 취득세·지방교육세(농어촌특별세 제외) */
export function divisionAcqTax(base: number) {
  const b = Math.max(0, fl(base));
  const acq = fl(b * A.rate);
  const edu = fl(b * (A.baseRate - A.heavyRate) * A.eduRate);
  return { acq, edu, total: acq + edu };
}

/** 특례 없이 일반 무상취득(3.5%)으로 했을 때 — 비교용, 중과 대상 주택은 아니라고 본다 */
export function plainGiftAcqTax(base: number) {
  const b = Math.max(0, fl(base));
  const acq = fl(b * A.baseRate);
  const edu = fl(b * (A.baseRate - A.heavyRate) * A.eduRate);
  return { acq, edu, total: acq + edu };
}

/**
 * 계산기 화면용 — 재산분할 세금과 특례로 줄어든 돈.
 * 농어촌특별세: 전용 85㎡ 이하(읍·면 100㎡) 주택이면 원인과 관계없이 비과세(농특세법 제4조 제11호·시행령 제4조 ⑤,
 * acquisition-extra-2026.json rural) → 0원. 그 밖은 특례세율과의 관계를 확인하지 못해 null(0원이 아니다).
 * saved 는 같은 과세표준을 특례 없이 무상취득(3.5%)했을 때와의 차이 — 농특세는 양쪽 다 빼고 비교한다.
 */
export function divisionAcqPage(base: number, smallHouse: boolean) {
  const x = divisionAcqTax(base);
  const p = plainGiftAcqTax(base);
  return { ...x, rural: smallHouse ? 0 : null, plainTotal: p.total, saved: p.total - x.total };
}
