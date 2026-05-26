import { getSettings, saveSettings } from "../background/storage.js";
import { MessageType } from "../messages/types.js";
import { requestLanguageOptions } from "../settings/language-options.js";
import { initSettingsWizard } from "../settings/wizard.js";

initSettingsWizard({
  root: document,
  loadSettings: getSettings,
  persistSettings: saveSettings,
  loadLanguageOptions: (apiKey) => requestLanguageOptions(chrome.runtime, apiKey),
  loadTabState: () => sendStevensTabMessage({ type: MessageType.GET_STEVENS_STATE }),
  persistTabState: (enabled) => sendStevensTabMessage({
    type: MessageType.SET_STEVENS_ENABLED,
    payload: { enabled },
  }),
});

async function sendStevensTabMessage(message) {
  const tab = await getActiveTab();
  if (!tab?.id) return { available: false };

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError || response?.type !== MessageType.STEVENS_STATE_RESULT) {
        resolve({ available: false });
        return;
      }

      resolve({
        available: true,
        enabled: Boolean(response.payload?.enabled),
      });
    });
  });
}

async function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab] = []) => {
      resolve(tab);
    });
  });
}
