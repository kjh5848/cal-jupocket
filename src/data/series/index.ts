/** 모든 자동완성 키워드 시리즈. 새 시리즈는 여기 한 줄 추가한다. */
import type { Series } from "./types";
import { irpSeriesDef } from "./irp-tax-credit";
import { vatFinalSeries } from "./vat-final-return";
import { vehiclePrepaySeries } from "./vehicle-tax-prepay";
import { withholdingReceiptSeries } from "./withholding-receipt";
import { yearEndSeries } from "./year-end";
import { childIncentiveSeries } from "./child-incentive";
import { earnedIncentiveSeries } from "./earned-incentive";
import { jongbuSeries } from "./jongbu";
import { medicalCreditSeries, educationCreditSeries, donationCreditSeries } from "./special-credit";
import { giftSeries, inheritanceSeries } from "./gift-inheritance";

export const allSeries: Series[] = [irpSeriesDef, vatFinalSeries, vehiclePrepaySeries, withholdingReceiptSeries, yearEndSeries, childIncentiveSeries, earnedIncentiveSeries, jongbuSeries, medicalCreditSeries, educationCreditSeries, donationCreditSeries, giftSeries, inheritanceSeries];
