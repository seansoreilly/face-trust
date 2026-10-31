// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyError, getScoreBand, isProductionHostname, sendEvent } from "./analytics";

const setHostname = (hostname: string): void => {
  vi.stubGlobal("location", { hostname });
  Object.defineProperty(window, "location", { value: { hostname }, configurable: true });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isProductionHostname", () => {
  it.each(["facetrust.info", "www.facetrust.info", "FaceTrust.info"])("allows %s", (h) => {
    expect(isProductionHostname(h)).toBe(true);
  });
  it.each(["localhost", "face-trust.lovable.app", "face-trust-abc.vercel.app", "evil-facetrust.info"])(
    "blocks %s",
    (h) => {
      expect(isProductionHostname(h)).toBe(false);
    }
  );
});

describe("sendEvent", () => {
  it("sends named params on production", () => {
    setHostname("facetrust.info");
    const gtag = vi.fn();
    window.gtag = gtag;
    sendEvent("analysis_error", { error_type: "network" });
    expect(gtag).toHaveBeenCalledWith("event", "analysis_error", { error_type: "network" });
  });

  it("does nothing off production", () => {
    setHostname("localhost");
    const gtag = vi.fn();
    window.gtag = gtag;
    sendEvent("analysis_error", { error_type: "network" });
    expect(gtag).not.toHaveBeenCalled();
  });
});

describe("getScoreBand", () => {
  it.each([
    [40, "guarded"],
    [41, "neutral"],
    [55, "neutral"],
    [56, "trustworthy"],
    [71, "very_trustworthy"],
    [86, "highly_trustworthy"],
  ])("score %i -> %s", (score, band) => {
    expect(getScoreBand(score)).toBe(band);
  });
});

describe("classifyError", () => {
  it("classifies known failures without leaking messages", () => {
    expect(classifyError(new Error("API request failed: 503 - overloaded"))).toBe("api_5xx");
    expect(classifyError(new Error("API request failed: 413 - too big"))).toBe("api_4xx");
    expect(classifyError(new Error("Invalid response format from analysis service"))).toBe("invalid_response");
    expect(classifyError(new Error("Failed to read image file"))).toBe("read_failed");
    expect(classifyError(new TypeError("Failed to fetch"))).toBe("network");
    expect(classifyError(new DOMException("x", "AbortError"))).toBe("aborted");
    expect(classifyError("boom")).toBe("unknown");
  });
});
