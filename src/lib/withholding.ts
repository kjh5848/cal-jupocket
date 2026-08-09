import rates from "../rates/2026.json";
import { won } from "./money";

const B = rates.withholding.business; // 0.033
const O = rates.withholding.other;    // 0.088

export function fromGross(gross: number) {
  const withholding = won(gross * B);
  return { gross: won(gross), withholding, net: won(gross) - withholding };
}

export function fromNet(net: number) {
  const gross = won(net / (1 - B));
  const withholding = won(gross * B);
  return { gross, withholding, net: gross - withholding };
}

export function otherIncome(gross: number) {
  const withholding = won(gross * O);
  return { gross: won(gross), withholding, net: won(gross) - withholding };
}
