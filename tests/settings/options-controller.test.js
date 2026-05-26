/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest } from "@jest/globals";
import { initOptionsPage } from "../../src/settings/options-controller.js";

function renderOptions() {
  document.body.innerHTML = `
    <input id="apiKey" />
    <select id="sourceLang"><option value="auto">Auto-detect</option></select>
    <select id="targetLang"><option value="EN">English</option></select>
    <button id="save"></button>
    <p id="status"></p>
  `;
}

describe("initOptionsPage", () => {
  it("should populate language selectors from DeepL language options", async () => {
    renderOptions();
    const page = initOptionsPage({
      root: document,
      loadSettings: () => Promise.resolve({ apiKey: "key:fx", sourceLang: "pt", targetLang: "pt-BR" }),
      persistSettings: jest.fn(),
      loadLanguageOptions: () => Promise.resolve({
        sourceLanguages: [{ language: "pt", name: "Portuguese" }],
        targetLanguages: [{ language: "pt-BR", name: "Portuguese (Brazilian)" }],
      }),
    });

    await page.load();

    expect(Array.from(document.getElementById("sourceLang").options).map((option) => option.value)).toEqual([
      "auto",
      "pt",
    ]);
    expect(Array.from(document.getElementById("targetLang").options).map((option) => option.value)).toEqual([
      "pt-BR",
    ]);
    expect(document.getElementById("sourceLang").value).toBe("pt");
    expect(document.getElementById("targetLang").value).toBe("pt-BR");
  });
});
