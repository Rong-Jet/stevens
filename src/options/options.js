import { getSettings, saveSettings } from "../background/storage.js";

const apiKeyInput = document.getElementById("apiKey");
const sourceLangSelect = document.getElementById("sourceLang");
const targetLangSelect = document.getElementById("targetLang");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

async function load() {
  const { apiKey, sourceLang, targetLang } = await getSettings();
  apiKeyInput.value = apiKey;
  sourceLangSelect.value = sourceLang;
  targetLangSelect.value = targetLang;
}

async function save() {
  const apiKey = apiKeyInput.value.trim();
  const sourceLang = sourceLangSelect.value;
  const targetLang = targetLangSelect.value;

  if (!apiKey) {
    setStatus("API key cannot be empty.", "err");
    return;
  }

  await saveSettings({ apiKey, sourceLang, targetLang });
  setStatus("Saved.", "ok");
}

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
  setTimeout(() => { statusEl.textContent = ""; statusEl.className = "status"; }, 2500);
}

saveBtn.addEventListener("click", save);
load();
