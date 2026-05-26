import { describe, it, expect } from "@jest/globals";
import { access, readFile } from "node:fs/promises";

async function readManifest() {
  return JSON.parse(await readFile("manifest.json", "utf8"));
}

describe("manifest", () => {
  it("should inject the content script into frames for embedded PDF viewers", async () => {
    const manifest = await readManifest();

    expect(manifest.content_scripts[0].all_frames).toBe(true);
  });

  it("should request context menu permission for selected PDF text fallback", async () => {
    const manifest = await readManifest();

    expect(manifest.permissions).toContain("contextMenus");
  });

  it("should use the packaged logo asset for extension and action icons", async () => {
    const manifest = await readManifest();
    const logoPath = "assets/logo.png";

    await expect(access(logoPath)).resolves.toBeUndefined();
    expect(manifest.icons).toEqual({
      "16": logoPath,
      "48": logoPath,
      "128": logoPath,
    });
    expect(manifest.action.default_icon).toEqual({
      "16": logoPath,
      "48": logoPath,
      "128": logoPath,
    });
  });

  it("should expose the logo asset to content-script injected page UI", async () => {
    const manifest = await readManifest();

    expect(manifest.web_accessible_resources).toEqual(
      expect.arrayContaining([
        {
          resources: ["assets/logo.png"],
          matches: ["<all_urls>"],
        },
      ])
    );
  });
});
