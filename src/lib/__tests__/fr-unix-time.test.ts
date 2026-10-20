import { describe, it, expect } from "vitest";
import { toParts, INT32_MAX } from "../unix-time";
import { frText, relativeTextFr } from "../fr/unix-time";

describe("fr unix-time", () => {
  it("frText — date en lettres (fr-FR) et heure sur 24 h", () => {
    expect(frText(toParts(1_792_380_896_000, 0))).toBe("lun. 19 octobre 2026, 03:34:56");
    expect(frText(toParts(0, 0))).toBe("jeu. 1 janvier 1970, 00:00:00");
    expect(frText(toParts(-1, 0))).toBe("mer. 31 décembre 1969, 23:59:59,999");
    expect(frText(toParts(INT32_MAX * 1000, 0))).toBe("mar. 19 janvier 2038, 03:14:07");
  });

  it("frText — le décalage horaire change le jour affiché", () => {
    // 2026-10-19 03:34:56 UTC, vu à UTC−05:00 → la veille au soir
    expect(frText(toParts(1_792_380_896_000, -300))).toBe("dim. 18 octobre 2026, 22:34:56");
    expect(frText(toParts(1_792_380_896_789, 120))).toBe("lun. 19 octobre 2026, 05:34:56,789");
  });

  it("relativeTextFr", () => {
    expect(relativeTextFr(0)).toBe("maintenant");
    expect(relativeTextFr(999)).toBe("maintenant");
    expect(relativeTextFr(-1000)).toBe("il y a 1 seconde");
    expect(relativeTextFr(12_000)).toBe("dans 12 secondes");
    expect(relativeTextFr(60_000)).toBe("dans 1 minute");
    expect(relativeTextFr(-(3 * 86_400 + 4 * 3600 + 5 * 60 + 6) * 1000)).toBe("il y a 3 jours 4 heures 5 minutes");
    expect(relativeTextFr((86_400 + 30) * 1000)).toBe("dans 1 jour");
    expect(relativeTextFr(200 * 86_400_000 + 3_600_000 + 60_000)).toBe("dans 200 jours 1 heure");
  });
});
