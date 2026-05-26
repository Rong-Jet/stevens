import { getLocalDeepLApiKey } from "../config/env.js";

const DEFAULTS = {
  apiKey: "",
  sourceLang: "auto",
  targetLang: "EN",
};

export async function getSettings() {
  const localApiKey = getLocalDeepLApiKey();
  const result = await chrome.storage.local.get(DEFAULTS);
  const browserApiKey = result.apiKey || "";

  return {
    ...result,
    apiKey: localApiKey || browserApiKey,
    apiKeySource: localApiKey ? "env" : browserApiKey ? "browser" : "none",
  };
}

export async function saveSettings(partial) {
  await chrome.storage.local.set(partial);
}
