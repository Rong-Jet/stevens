const DEFAULTS = {
  apiKey: "",
  sourceLang: "auto",
  targetLang: "EN",
};

export async function getSettings() {
  const result = await chrome.storage.local.get(DEFAULTS);
  return result;
}

export async function saveSettings(partial) {
  await chrome.storage.local.set(partial);
}
