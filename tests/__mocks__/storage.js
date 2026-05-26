export let _store = { apiKey: "test-key", sourceLang: "auto", targetLang: "EN" };

export async function getSettings() {
  return { ..._store };
}

export async function saveSettings(partial) {
  Object.assign(_store, partial);
}

export function __setStore(values) {
  _store = { ..._store, ...values };
}
