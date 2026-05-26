import { populateLanguageSelect } from "./language-options.js";

export function initSettingsWizard({
  root = document,
  loadSettings,
  persistSettings,
  loadLanguageOptions,
  loadTabState,
  persistTabState,
} = {}) {
  const tabEnabledToggle = root.querySelector("#popupTabEnabled");
  const tabToggleHint = root.querySelector("#popupTabToggleHint");
  const apiKeyInput = root.querySelector("#popupApiKey");
  const sourceLangSelect = root.querySelector("#popupSourceLang");
  const targetLangSelect = root.querySelector("#popupTargetLang");
  const apiKeyHint = root.querySelector("#popupApiKeyHint");
  const statusEl = root.querySelector("#popupStatus");
  const steps = Array.from(root.querySelectorAll("[data-step]"));
  const apiKeyStep = apiKeyInput.closest("[data-step]");
  const nextButtons = Array.from(root.querySelectorAll("[data-next-step]"));
  const previousButtons = Array.from(root.querySelectorAll("[data-previous-step]"));
  const saveButtons = Array.from(root.querySelectorAll("[data-save-settings]"));
  const stepIndicators = Array.from(root.querySelectorAll(".popup-steps span"));

  let currentStep = 0;
  let visibleSteps = steps;
  let apiKeySource = "none";

  function showStep(index) {
    currentStep = Math.max(0, Math.min(index, visibleSteps.length - 1));
    steps.forEach((step) => {
      step.hidden = true;
    });
    visibleSteps.forEach((step, stepIndex) => {
      step.hidden = stepIndex !== currentStep;
    });
    stepIndicators.forEach((indicator, stepIndex) => {
      indicator.hidden = stepIndex >= visibleSteps.length;
      indicator.classList.toggle("is-active", stepIndex === currentStep);
    });
  }

  function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = `popup-status ${type}`.trim();
  }

  async function save() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKeySource !== "env" && !apiKey) {
      setStatus("API key cannot be empty.", "err");
      showStep(0);
      return false;
    }

    const settings = {
      sourceLang: sourceLangSelect.value,
      targetLang: targetLangSelect.value,
    };
    if (apiKeySource !== "env") {
      settings.apiKey = apiKey;
    }

    await persistSettings(settings);
    setStatus("Saved.", "ok");
    return true;
  }

  const ready = loadSettings().then(async (settings) => {
    const { apiKey = "", sourceLang = "auto", targetLang = "EN" } = settings;
    apiKeySource = settings.apiKeySource ?? "none";
    visibleSteps = steps;
    apiKeyInput.value = apiKeySource === "env" ? "" : apiKey;
    sourceLangSelect.value = sourceLang;
    targetLangSelect.value = targetLang;
    await loadLanguages(apiKey, sourceLang, targetLang);
    if (apiKeyHint) {
      apiKeyHint.textContent = apiKeySource === "env"
        ? "API key loaded from local .env."
        : apiKey
          ? "API key saved in browser storage."
          : "";
    }
    await loadCurrentTabState();
    showStep(0);
  });

  async function loadCurrentTabState() {
    if (!tabEnabledToggle || typeof loadTabState !== "function") return;

    const state = await loadTabState();
    if (!state?.available) {
      tabEnabledToggle.checked = false;
      tabEnabledToggle.disabled = true;
      if (tabToggleHint) tabToggleHint.textContent = "Unavailable on this page.";
      return;
    }

    tabEnabledToggle.checked = Boolean(state.enabled);
    tabEnabledToggle.disabled = false;
    if (tabToggleHint) tabToggleHint.textContent = "";
  }

  tabEnabledToggle?.addEventListener("change", async () => {
    if (typeof persistTabState !== "function") return;

    try {
      const state = await persistTabState(tabEnabledToggle.checked);
      tabEnabledToggle.checked = Boolean(state?.enabled);
      if (tabToggleHint) tabToggleHint.textContent = "";
    } catch (err) {
      tabEnabledToggle.checked = false;
      tabEnabledToggle.disabled = true;
      if (tabToggleHint) tabToggleHint.textContent = "Unavailable on this page.";
    }
  });

  nextButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (visibleSteps[currentStep] === apiKeyStep) {
        await loadLanguages(getLanguageApiKey(), sourceLangSelect.value, targetLangSelect.value);
      }
      showStep(currentStep + 1);
    });
  });
  previousButtons.forEach((button) => {
    button.addEventListener("click", () => showStep(currentStep - 1));
  });
  saveButtons.forEach((button) => {
    button.addEventListener("click", () => {
      void save();
    });
  });

  return { ready, save, showStep };

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

  function getLanguageApiKey() {
    if (apiKeySource === "env") return "";
    return apiKeyInput.value.trim();
  }
}
