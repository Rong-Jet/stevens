import { getSettings, saveSettings } from "../background/storage.js";
import { initSettingsWizard } from "../settings/wizard.js";

initSettingsWizard({
  root: document,
  loadSettings: getSettings,
  persistSettings: saveSettings,
});
