import { describe, expect, it } from "vitest";

describe("probe", () => {
  it("resolves core-infrastructure", async () => {
    const mod = await import("@caffeineai/core-infrastructure");
    console.log("EXPORTS", Object.keys(mod).sort().join(","));
    console.log(
      "IIPROVIDER",
      String(mod.InternetIdentityProvider).slice(2500, 6000),
    );
    expect(mod).toBeTruthy();
  });
});
