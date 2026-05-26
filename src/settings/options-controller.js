import { populateLanguageSelect } from "./language-options.js";

export function initOptionsPage({
  root = document,
  loadSettings,
  persistSettings,
  loadLanguageOptions,
  clearStatusDelayMs = 2500,
} = {}) {
  const apiKeyInput = root.getElementById("apiKey");
  const sourceLangSelect = root.getElementById("sourceLang");
  const targetLangSelect = root.getElementById("targetLang");
  const saveBtn = root.getElementById("save");
  const statusEl = root.getElementById("status");

  async function load() {
    const { apiKey, sourceLang, targetLang } = await loadSettings();
    apiKeyInput.value = apiKey;
    sourceLangSelect.value = sourceLang;
    targetLangSelect.value = targetLang;
    await loadLanguages(apiKey, sourceLang, targetLang);
  }

  async function save() {
    const apiKey = apiKeyInput.value.trim();
    const sourceLang = sourceLangSelect.value;
    const targetLang = targetLangSelect.value;

    if (!apiKey) {
      setStatus("API key cannot be empty.", "err");
      return;
    }

    await persistSettings({ apiKey, sourceLang, targetLang });
    setStatus("Saved.", "ok");
  }

  async function loadLanguages(apiKey, sourceLang, targetLang) {
    if (!apiKey || typeof loadLanguageOptions !== "function") return;

    try {
      const { sourceLanguages, targetLanguages } = await loadLanguageOptions(apiKey);
      populateLanguageSelect(sourceLangSelect, sourceLanguages, sourceLang, { includeAuto: true });
      populateLanguageSelect(targetLangSelect, targetLanguages, targetLang);
    } catch (err) {
      setStatus("Unable to load DeepL languages.", "err");
    }
  }

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = `status ${type}`;
    setTimeout(() => { statusEl.textContent = ""; statusEl.className = "status"; }, clearStatusDelayMs);
  }

  saveBtn.addEventListener("click", save);
  apiKeyInput.addEventListener("change", () => {
    void loadLanguages(apiKeyInput.value.trim(), sourceLangSelect.value, targetLangSelect.value);
  });

  return { load, save };
}
