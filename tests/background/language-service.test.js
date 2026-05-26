import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const mockFetchTranslationLanguages = jest.fn();

jest.unstable_mockModule("../../src/background/api.js", () => ({
  fetchTranslationLanguages: mockFetchTranslationLanguages,
  ApiError: class ApiError extends Error {
    constructor(status, body) { super(`${status}: ${body}`); this.status = status; }
  },
}));

const { getTranslationLanguages, LanguageServiceError } = await import("../../src/background/language-service.js");

function setStorage(values) {
  globalThis.chrome.storage.local.get = () => Promise.resolve(values);
}

describe("getTranslationLanguages", () => {
  beforeEach(() => {
    mockFetchTranslationLanguages.mockReset();
    setStorage({ apiKey: "stored-key:fx", sourceLang: "auto", targetLang: "en-US" });
  });

  it("should fetch language options using the stored API key", async () => {
    const languages = {
      sourceLanguages: [{ language: "en", name: "English" }],
      targetLanguages: [{ language: "pt-BR", name: "Portuguese (Brazilian)" }],
    };
    mockFetchTranslationLanguages.mockResolvedValue(languages);

    await expect(getTranslationLanguages()).resolves.toEqual(languages);
    expect(mockFetchTranslationLanguages).toHaveBeenCalledWith("stored-key:fx");
  });

  it("should fetch language options using an API key override", async () => {
    mockFetchTranslationLanguages.mockResolvedValue({ sourceLanguages: [], targetLanguages: [] });

    await getTranslationLanguages("typed-key:fx");

    expect(mockFetchTranslationLanguages).toHaveBeenCalledWith("typed-key:fx");
  });

  it("should throw a service error when no API key is available", async () => {
    setStorage({ apiKey: "", sourceLang: "auto", targetLang: "en-US" });

    await expect(getTranslationLanguages()).rejects.toThrow(LanguageServiceError);
    await expect(getTranslationLanguages()).rejects.toThrow("No API key configured");
  });
});
