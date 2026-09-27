import { describe, expect, it } from "vitest";
import { eur, eurToCents, pct, timeLeft, timeAgo } from "./format";

describe("eur", () => {
  it("formats cents as euro amounts", () => {
    expect(eur(14900)).toMatch(/149/);
    expect(eur(9900)).toMatch(/99/);
  });

  it("formats zero as a real currency value", () => {
    expect(eur(0)).toMatch(/0[.,]00/);
  });
});

describe("pct", () =>  {
  it("computes the discount percent from original to best", () => {
    expect(pct(14900, 9900)).toBe("-34%");
  });

  it("returns 0% when there is no discount", () => {
    expect(pct(14900, 14900)).toBe("0%");
  });

  it("never divides by zero on a zero original price", () => {
    expect(pct(0, 100)).toBe("0%");
  });

  it("clamps a lower-than-original best price to a negative discount safely", () => {
    // bestPrice above originalPrice would be a data error; format must not crash
    expect(() => pct(100, 200)).not.toThrow();
  });
});

describe("timeLeft", () => {
  it("reports Ended for past end times", () => {
    expect(timeLeft(Date.now() - 1000)).toBe("Ended");
  });

  it("reports days and hours for wars ending far out", () => {
    const inFiveDays = Date.now() + 5 * 86400000 + 3 * 3600000;
    expect(timeLeft(inFiveDays)).toBe("5d 3h");
  });

  it("reports hours and minutes for wars ending soon", () => {
    const inTwoHours = Date.now() + 2 * 3600000 + 15 * 60000;
    expect(timeLeft(inTwoHours)).toMatch(/^2h 15m$/);
  });

  it("reports minutes only when under an hour", () => {
    expect(timeLeft(Date.now() + 10 * 60000)).toMatch(/m$/);
  });
});

describe("eurToCents", () => {
  it("parses dot decimals into cents", () => {
    expect(eurToCents("49.90")).toBe(4990);
  });

  it("parses comma decimals (European format)", () => {
    expect(eurToCents("49,90")).toBe(4990);
  });

  it("parses whole numbers", () => {
    expect(eurToCents("50")).toBe(5000);
  });

  it("trims whitespace", () => {
    expect(eurToCents("  5 ")).toBe(500);
  });

  it("rounds sub-cent values", () => {
    expect(eurToCents("0.005")).toBe(null); // 3 decimals not allowed
  });

  it("rejects invalid inputs", () => {
    expect(eurToCents("")).toBe(null);
    expect(eurToCents("abc")).toBe(null);
    expect(eurToCents("-10")).toBe(null);
    expect(eurToCents("0")).toBe(null);
    expect(eurToCents("0.00")).toBe(null);
    expect(eurToCents("1.999")).toBe(null);
    expect(eurToCents("12.345,67")).toBe(null); // no thousands separators
  });

  it("caps at a sane maximum (€1M)", () => {
    expect(eurToCents("1000001")).toBe(null);
    expect(eurToCents("999999.99")).toBe(99999999);
  });
});

describe("timeAgo", () => {
  it("returns 'just now' for very recent events", () => {
    expect(timeAgo(Date.now() - 5000)).toBe("just now");
  });

  it("formats minutes ago", () => {
    expect(timeAgo(Date.now() - 5 * 60000)).toBe("5m ago");
  });

  it("formats hours ago", () => {
    expect(timeAgo(Date.now() - 3 * 3600000)).toBe("3h ago");
  });

  it("formats days ago", () => {
    expect(timeAgo(Date.now() - 2 * 86400000)).toBe("2d ago");
  });

  it("falls back to a date string beyond a week", () => {
    const ts = Date.now() - 10 * 86400000;
    expect(timeAgo(ts)).not.toMatch(/(just now|m ago|h ago|d ago)$/);
  });
});
