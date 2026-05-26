export function initSettingsWizard({ root = document, loadSettings, persistSettings } = {}) {
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

  const ready = loadSettings().then((settings) => {
    const { apiKey = "", sourceLang = "auto", targetLang = "EN" } = settings;
    apiKeySource = settings.apiKeySource ?? "none";
    visibleSteps = apiKeySource === "env" ? steps.filter((step) => step !== apiKeyStep) : steps;
    apiKeyInput.value = apiKeySource === "env" ? "" : apiKey;
    sourceLangSelect.value = sourceLang;
    targetLangSelect.value = targetLang;
    if (apiKeyHint) {
      apiKeyHint.textContent = apiKeySource === "env"
        ? "API key loaded from local .env."
        : apiKey
          ? "API key saved in browser storage."
          : "";
    }
    showStep(0);
  });

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => showStep(currentStep + 1));
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
}
