import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { fetchTranslation, fetchTranslationLanguages, ApiError } from "../../src/background/api.js";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => body,
  };
}

describe("fetchTranslation", () => {
  beforeEach(() => mockFetch.mockReset());

  it("should return translation and detectedLang on success", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {
      translations: [{ text: "Hola", detected_source_language: "EN" }],
    }));

    const result = await fetchTranslation("Hello", "ES", "my-key");

    expect(result).toEqual({ translation: "Hola", detectedLang: "EN" });
  });

  it("should send key via Authorization header (DeepL-Auth-Key scheme)", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {
      translations: [{ text: "Bonjour", detected_source_language: "EN" }],
    }));

    await fetchTranslation("Hello", "FR", "secret-key:fx");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("DeepL-Auth-Key secret-key:fx");
  });

  it("should send JSON body with text array and target_lang", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {
      translations: [{ text: "Hola", detected_source_language: "EN" }],
    }));

    await fetchTranslation("Hello world", "ES", "k:fx");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual({ text: ["Hello world"], target_lang: "ES" });
  });

  it("should pass regional target language codes through to DeepL", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {
      translations: [{ text: "Olá", detected_source_language: "EN" }],
    }));

    await fetchTranslation("Hello", "pt-BR", "k:fx");

    const [, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ text: ["Hello"], target_lang: "pt-BR" });
  });

  it("should send source_lang when source language is specific", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {
      translations: [{ text: "Hallo", detected_source_language: "EN" }],
    }));

    await fetchTranslation("Hello", "DE", "k:fx", "EN");

    const [, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ text: ["Hello"], target_lang: "DE", source_lang: "EN" });
  });

  it("should use free-tier URL for keys ending in :fx", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {
      translations: [{ text: "Hola", detected_source_language: "EN" }],
    }));

    await fetchTranslation("Hello", "ES", "abc123:fx");

    const [url] = mockFetch.mock.calls[0];
    expect(url.startsWith("https://api-free.deepl.com/v2/translate")).toBe(true);
  });

  it("should use pro-tier URL for keys not ending in :fx", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, {
      translations: [{ text: "Hola", detected_source_language: "EN" }],
    }));

    await fetchTranslation("Hello", "ES", "abc123-pro-key");

    const [url] = mockFetch.mock.calls[0];
    expect(url.startsWith("https://api.deepl.com/v2/translate")).toBe(true);
  });

  it("should throw ApiError with status on non-2xx response", async () => {
    mockFetch.mockResolvedValue(makeResponse(403, "Forbidden"));

    await expect(fetchTranslation("Hello", "EN", "bad-key:fx")).rejects.toThrow(ApiError);
    await expect(fetchTranslation("Hello", "EN", "bad-key:fx")).rejects.toMatchObject({ status: 403 });
  });
});

describe("fetchTranslationLanguages", () => {
  beforeEach(() => mockFetch.mockReset());

  it("should fetch translation languages from DeepL v3", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, [
      { lang: "en", name: "English", usable_as_source: true, usable_as_target: false },
      { lang: "en-US", name: "English (American)", usable_as_source: false, usable_as_target: true },
      { lang: "pt", name: "Portuguese", usable_as_source: true, usable_as_target: false },
      { lang: "pt-BR", name: "Portuguese (Brazilian)", usable_as_source: false, usable_as_target: true },
      { lang: "de", name: "German", usable_as_source: true, usable_as_target: true },
    ]));

    const result = await fetchTranslationLanguages("k:fx");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api-free.deepl.com/v3/languages?resource=translate_text");
    expect(options.headers["Authorization"]).toBe("DeepL-Auth-Key k:fx");
    expect(result).toEqual({
      sourceLanguages: [
        { language: "en", name: "English" },
        { language: "pt", name: "Portuguese" },
        { language: "de", name: "German" },
      ],
      targetLanguages: [
        { language: "en-US", name: "English (American)" },
        { language: "pt-BR", name: "Portuguese (Brazilian)" },
        { language: "de", name: "German" },
      ],
    });
  });
});
