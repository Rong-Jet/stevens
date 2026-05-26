import { describe, it, expect } from "@jest/globals";
import { readFile } from "node:fs/promises";

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
});
