import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const mockFetchTranslation = jest.fn();

jest.unstable_mockModule("../../src/background/api.js", () => ({
  fetchTranslation: mockFetchTranslation,
  ApiError: class ApiError extends Error {
    constructor(status, body) { super(`${status}: ${body}`); this.status = status; }
  },
}));

const { translate, TranslationServiceError } = await import("../../src/background/translation-service.js");
const { ApiError } = await import("../../src/background/api.js");

function setStorage(values) {
  globalThis.chrome.storage.local.get = () => Promise.resolve(values);
}

const DEFAULT_SETTINGS = { apiKey: "valid-key", targetLang: "EN", sourceLang: "auto" };

describe("translate", () => {
  beforeEach(() => {
    mockFetchTranslation.mockReset();
    setStorage(DEFAULT_SETTINGS);
  });

  it("should return translation result with target language when API succeeds", async () => {
    mockFetchTranslation.mockResolvedValue({ translation: "Hola", detectedLang: "EN" });

    const result = await translate("Hello");

    expect(result).toEqual({ translation: "Hola", detectedLang: "EN", targetLang: "EN", sourceLang: "auto" });
  });

  it("should throw TranslationServiceError when text is empty", async () => {
    await expect(translate("")).rejects.toThrow(TranslationServiceError);
    await expect(translate("   ")).rejects.toThrow(TranslationServiceError);
  });

  it("should throw TranslationServiceError when text exceeds 500 chars", async () => {
    await expect(translate("a".repeat(501))).rejects.toThrow(TranslationServiceError);
  });

  it("should throw TranslationServiceError when no API key is set", async () => {
    setStorage({ apiKey: "", targetLang: "EN" });

    await expect(translate("Hello")).rejects.toThrow(TranslationServiceError);
    await expect(translate("Hello")).rejects.toThrow("No API key configured");
  });

  it("should surface friendly message on 403", async () => {
    mockFetchTranslation.mockRejectedValue(new ApiError(403, "Forbidden"));

    await expect(translate("Hello")).rejects.toThrow("Invalid API key");
  });

  it("should surface friendly message on 429", async () => {
    mockFetchTranslation.mockRejectedValue(new ApiError(429, "Too Many Requests"));

    await expect(translate("Hello")).rejects.toThrow("Rate limit");
  });

  it("should surface friendly message on 456 quota exceeded", async () => {
    mockFetchTranslation.mockRejectedValue(new ApiError(456, "Quota Exceeded"));

    await expect(translate("Hello")).rejects.toThrow("quota exceeded");
  });

  it("should surface DeepL error status for other API errors", async () => {
    mockFetchTranslation.mockRejectedValue(new ApiError(400, "Bad Request"));

    await expect(translate("Hello")).rejects.toThrow("DeepL error 400");
  });

  it("should trim whitespace from text before translating", async () => {
    mockFetchTranslation.mockResolvedValue({ translation: "Hola", detectedLang: "EN" });

    await translate("  Hello  ");

    expect(mockFetchTranslation).toHaveBeenCalledWith("Hello", "EN", "valid-key", "auto");
  });
});
