import { getSettings, saveSettings } from "../background/storage.js";
import { requestLanguageOptions } from "../settings/language-options.js";
import { initOptionsPage } from "../settings/options-controller.js";

const page = initOptionsPage({
  root: document,
  loadSettings: getSettings,
  persistSettings: saveSettings,
  loadLanguageOptions: (apiKey) => requestLanguageOptions(chrome.runtime, apiKey),
});

void page.load();
