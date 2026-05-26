export function initSettingsWizard({ root = document, loadSettings, persistSettings } = {}) {
  const apiKeyInput = root.querySelector("#popupApiKey");
  const sourceLangSelect = root.querySelector("#popupSourceLang");
  const targetLangSelect = root.querySelector("#popupTargetLang");
  const statusEl = root.querySelector("#popupStatus");
  const steps = Array.from(root.querySelectorAll("[data-step]"));
  const nextButtons = Array.from(root.querySelectorAll("[data-next-step]"));
  const previousButtons = Array.from(root.querySelectorAll("[data-previous-step]"));
  const saveButtons = Array.from(root.querySelectorAll("[data-save-settings]"));
  const stepIndicators = Array.from(root.querySelectorAll(".popup-steps span"));

  let currentStep = 0;

  function showStep(index) {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, stepIndex) => {
      step.hidden = stepIndex !== currentStep;
    });
    stepIndicators.forEach((indicator, stepIndex) => {
      indicator.classList.toggle("is-active", stepIndex === currentStep);
    });
  }

  function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = `popup-status ${type}`.trim();
  }

  async function save() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      setStatus("API key cannot be empty.", "err");
      showStep(0);
      return false;
    }

    await persistSettings({
      apiKey,
      sourceLang: sourceLangSelect.value,
      targetLang: targetLangSelect.value,
    });
    setStatus("Saved.", "ok");
    return true;
  }

  const ready = loadSettings().then(({ apiKey = "", sourceLang = "auto", targetLang = "EN" }) => {
    apiKeyInput.value = apiKey;
    sourceLangSelect.value = sourceLang;
    targetLangSelect.value = targetLang;
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
