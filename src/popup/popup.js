import { getSettings, saveSettings } from "../background/storage.js";
import { requestLanguageOptions } from "../settings/language-options.js";
import { initSettingsWizard } from "../settings/wizard.js";

initSettingsWizard({
  root: document,
  loadSettings: getSettings,
  persistSettings: saveSettings,
  loadLanguageOptions: (apiKey) => requestLanguageOptions(chrome.runtime, apiKey),
});
