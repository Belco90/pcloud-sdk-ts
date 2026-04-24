import { describe, it, expect } from "vitest";
import { buildUrl } from "../../../src/transport/url";

describe("buildUrl", () => {
  it("builds a basic URL without params", () => {
    const url = buildUrl("api.pcloud.com", "userinfo");
    expect(url).toBe("https://api.pcloud.com/userinfo");
  });

  it("appends query params", () => {
    const url = buildUrl("api.pcloud.com", "listfolder", { folderid: "0", recursive: "1" });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("folderid")).toBe("0");
    expect(parsed.searchParams.get("recursive")).toBe("1");
  });

  it("omits undefined params", () => {
    const url = buildUrl("api.pcloud.com", "listfolder", { folderid: "0", recursive: undefined });
    const parsed = new URL(url);
    expect(parsed.searchParams.has("recursive")).toBe(false);
  });

  it("uses the provided server in the host", () => {
    const url = buildUrl("eapi.pcloud.com", "userinfo");
    expect(url).toContain("eapi.pcloud.com");
  });
});
