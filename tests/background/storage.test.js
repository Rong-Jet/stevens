import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { getSettings } from "../../src/background/storage.js";

describe("getSettings", () => {
  beforeEach(() => {
    delete globalThis.__STEVENS_LOCAL_DEEPL_API_KEY__;
  });

  it("should report browser api key source when key is stored in chrome storage", async () => {
    globalThis.chrome.storage.local.get = jest.fn(() => Promise.resolve({
      apiKey: "browser-key:fx",
      sourceLang: "auto",
      targetLang: "EN",
    }));

    await expect(getSettings()).resolves.toMatchObject({
      apiKey: "browser-key:fx",
      apiKeySource: "browser",
    });
  });

  it("should report env api key source when key is injected at build time", async () => {
    globalThis.__STEVENS_LOCAL_DEEPL_API_KEY__ = "env-key:fx";
    globalThis.chrome.storage.local.get = jest.fn(() => Promise.resolve({
      apiKey: "browser-key:fx",
      sourceLang: "auto",
      targetLang: "EN",
    }));

    await expect(getSettings()).resolves.toMatchObject({
      apiKey: "env-key:fx",
      apiKeySource: "env",
    });
  });
});
