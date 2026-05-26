/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest } from "@jest/globals";
import { MessageType } from "../../src/messages/types.js";
import { populateLanguageSelect, requestLanguageOptions } from "../../src/settings/language-options.js";

describe("populateLanguageSelect", () => {
  it("should populate a source language select with auto-detect and DeepL v3 source languages", () => {
    document.body.innerHTML = `<select id="source"><option value="auto">Auto-detect</option></select>`;
    const select = document.getElementById("source");

    populateLanguageSelect(select, [
      { language: "en", name: "English" },
      { language: "pt", name: "Portuguese" },
    ], "pt", { includeAuto: true });

    expect(Array.from(select.options).map((option) => [option.value, option.textContent])).toEqual([
      ["auto", "Auto-detect"],
      ["en", "English"],
      ["pt", "Portuguese"],
    ]);
    expect(select.value).toBe("pt");
  });

  it("should populate a target language select with regional variants from DeepL v3", () => {
    document.body.innerHTML = `<select id="target"></select>`;
    const select = document.getElementById("target");

    populateLanguageSelect(select, [
      { language: "en-US", name: "English (American)" },
      { language: "pt-BR", name: "Portuguese (Brazilian)" },
    ], "pt-BR");

    expect(Array.from(select.options).map((option) => [option.value, option.textContent])).toEqual([
      ["en-US", "English (American)"],
      ["pt-BR", "Portuguese (Brazilian)"],
    ]);
    expect(select.value).toBe("pt-BR");
  });

  it("should normalize legacy uppercase saved language codes to v3 option values", () => {
    document.body.innerHTML = `<select id="target"></select>`;
    const select = document.getElementById("target");

    populateLanguageSelect(select, [
      { language: "en-US", name: "English (American)" },
      { language: "pt-BR", name: "Portuguese (Brazilian)" },
    ], "PT-BR");

    expect(select.value).toBe("pt-BR");
  });

  it("should map legacy generic English target settings to American English", () => {
    document.body.innerHTML = `<select id="target"></select>`;
    const select = document.getElementById("target");

    populateLanguageSelect(select, [
      { language: "en-US", name: "English (American)" },
      { language: "en-GB", name: "English (British)" },
    ], "EN");

    expect(select.value).toBe("en-US");
  });
});

describe("requestLanguageOptions", () => {
  it("should request DeepL language options through the background worker", async () => {
    const sendMessage = jest.fn((message, callback) => {
      callback({
        type: MessageType.LANGUAGE_OPTIONS_RESULT,
        payload: {
          sourceLanguages: [{ language: "en", name: "English" }],
          targetLanguages: [{ language: "pt-BR", name: "Portuguese (Brazilian)" }],
        },
      });
    });

    await expect(requestLanguageOptions({ id: "runtime-id", sendMessage }, "typed-key:fx")).resolves.toEqual({
      sourceLanguages: [{ language: "en", name: "English" }],
      targetLanguages: [{ language: "pt-BR", name: "Portuguese (Brazilian)" }],
    });
    expect(sendMessage).toHaveBeenCalledWith(
      { type: MessageType.GET_LANGUAGE_OPTIONS, payload: { apiKey: "typed-key:fx" } },
      expect.any(Function)
    );
  });
});
