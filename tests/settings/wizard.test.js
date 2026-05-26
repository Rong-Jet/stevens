/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { initSettingsWizard } from "../../src/settings/wizard.js";

function renderWizard() {
  document.body.innerHTML = `
    <section data-step="0"></section>
    <section data-step="1" hidden></section>
    <section data-step="2" hidden></section>
    <input id="popupApiKey" />
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
});
