/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { initSettingsWizard } from "../../src/settings/wizard.js";

function renderWizard() {
  document.body.innerHTML = `
    <section data-step="0">
      <label>
        <input id="popupTabEnabled" type="checkbox" />
        Stevens on this tab
      </label>
      <p id="popupTabToggleHint"></p>
      <input id="popupApiKey" />
      <p id="popupApiKeyHint"></p>
    </section>
    <section data-step="1" hidden></section>
    <section data-step="2" hidden></section>
    <select id="popupSourceLang">
      <option value="auto">Auto-detect</option>
      <option value="DE">German</option>
    </select>
    <select id="popupTargetLang">
      <option value="EN">English</option>
      <option value="ES">Spanish</option>
    </select>
    <button data-next-step></button>
    <button data-previous-step></button>
    <button data-save-settings></button>
    <p id="popupStatus"></p>
  `;
}

describe("initSettingsWizard", () => {
  beforeEach(() => {
    renderWizard();
  });

  it("should save api key, source language, and target language from the wizard", async () => {
    const persistSettings = jest.fn(() => Promise.resolve());
    const wizard = initSettingsWizard({
      root: document,
      loadSettings: () => Promise.resolve({ apiKey: "", sourceLang: "auto", targetLang: "EN" }),
      persistSettings,
    });
    await wizard.ready;

    document.getElementById("popupApiKey").value = "secret-key:fx";
    document.getElementById("popupSourceLang").value = "DE";
    document.getElementById("popupTargetLang").value = "ES";

    await wizard.save();

    expect(persistSettings).toHaveBeenCalledWith({
      apiKey: "secret-key:fx",
      sourceLang: "DE",
      targetLang: "ES",
    });
    expect(document.getElementById("popupStatus").textContent).toBe("Saved.");
  });

  it("should keep the first settings step visible and save only languages when api key comes from env", async () => {
    const persistSettings = jest.fn(() => Promise.resolve());
    const wizard = initSettingsWizard({
      root: document,
      loadSettings: () => Promise.resolve({
        apiKey: "env-key:fx",
        apiKeySource: "env",
        sourceLang: "auto",
        targetLang: "EN",
      }),
      persistSettings,
    });
    await wizard.ready;

    document.getElementById("popupSourceLang").value = "DE";
    document.getElementById("popupTargetLang").value = "ES";

    expect(document.querySelector('[data-step="0"]').hidden).toBe(false);
    expect(document.getElementById("popupApiKey").value).toBe("");

    await wizard.save();

    expect(persistSettings).toHaveBeenCalledWith({
      sourceLang: "DE",
      targetLang: "ES",
    });
  });

  it("should populate language selectors from DeepL language options when an api key is available", async () => {
    const wizard = initSettingsWizard({
      root: document,
      loadSettings: () => Promise.resolve({
        apiKey: "env-key:fx",
        apiKeySource: "env",
        sourceLang: "pt",
        targetLang: "pt-BR",
      }),
      persistSettings: jest.fn(),
      loadLanguageOptions: () => Promise.resolve({
        sourceLanguages: [{ language: "pt", name: "Portuguese" }],
        targetLanguages: [{ language: "pt-BR", name: "Portuguese (Brazilian)" }],
      }),
    });

    await wizard.ready;

    expect(Array.from(document.getElementById("popupSourceLang").options).map((option) => option.value)).toEqual([
      "auto",
      "pt",
    ]);
    expect(Array.from(document.getElementById("popupTargetLang").options).map((option) => option.value)).toEqual([
      "pt-BR",
    ]);
    expect(document.getElementById("popupSourceLang").value).toBe("pt");
    expect(document.getElementById("popupTargetLang").value).toBe("pt-BR");
  });

  it("should load language options with the typed api key before moving to language selection", async () => {
    const loadLanguageOptions = jest.fn(() => Promise.resolve({
      sourceLanguages: [{ language: "en", name: "English" }],
      targetLanguages: [{ language: "pt-BR", name: "Portuguese (Brazilian)" }],
    }));
    const wizard = initSettingsWizard({
      root: document,
      loadSettings: () => Promise.resolve({ apiKey: "", sourceLang: "auto", targetLang: "EN" }),
      persistSettings: jest.fn(),
      loadLanguageOptions,
    });
    await wizard.ready;

    document.getElementById("popupApiKey").value = "typed-key:fx";
    document.querySelector("[data-next-step]").click();
    await Promise.resolve();

    expect(loadLanguageOptions).toHaveBeenCalledWith("typed-key:fx");
    expect(Array.from(document.getElementById("popupTargetLang").options).map((option) => option.value)).toEqual([
      "pt-BR",
    ]);
  });

  it("should show and immediately persist the current tab Stevens toggle", async () => {
    const persistTabState = jest.fn(() => Promise.resolve({ enabled: true }));
    const wizard = initSettingsWizard({
      root: document,
      loadSettings: () => Promise.resolve({ apiKey: "", sourceLang: "auto", targetLang: "EN" }),
      persistSettings: jest.fn(),
      loadTabState: () => Promise.resolve({ available: true, enabled: false }),
      persistTabState,
    });
    await wizard.ready;

    const toggle = document.getElementById("popupTabEnabled");
    expect(toggle.checked).toBe(false);

    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    await Promise.resolve();

    expect(persistTabState).toHaveBeenCalledWith(true);
    expect(toggle.checked).toBe(true);
  });

  it("should disable the current tab Stevens toggle when the page is unavailable", async () => {
    const wizard = initSettingsWizard({
      root: document,
      loadSettings: () => Promise.resolve({ apiKey: "", sourceLang: "auto", targetLang: "EN" }),
      persistSettings: jest.fn(),
      loadTabState: () => Promise.resolve({ available: false }),
    });
    await wizard.ready;

    expect(document.getElementById("popupTabEnabled").disabled).toBe(true);
    expect(document.getElementById("popupTabToggleHint").textContent).toBe("Unavailable on this page.");
  });
});
