import { MessageType } from "../messages/types.js";

export function populateLanguageSelect(select, languages, selectedValue, { includeAuto = false } = {}) {
  const options = includeAuto
    ? [{ language: "auto", name: "Auto-detect" }, ...languages]
    : languages;

  select.replaceChildren(...options.map(({ language, name }) => {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = name;
    return option;
  }));

  select.value = resolveSelectedLanguage(options, selectedValue);
}

function resolveSelectedLanguage(options, selectedValue) {
  const optionValues = new Set(options.map((option) => option.language));
  const candidates = [
    selectedValue,
    toBCP47Code(selectedValue),
    legacyTargetAliases[selectedValue],
  ].filter(Boolean);

  return candidates.find((candidate) => optionValues.has(candidate)) ?? options[0]?.language ?? "";
}

function toBCP47Code(language) {
  if (!language) return "";
  return language
    .split("-")
    .map((part, index) => index === 0 ? part.toLowerCase() : part.toUpperCase())
    .join("-");
}

const legacyTargetAliases = {
  EN: "en-US",
  PT: "pt-BR",
};

export function requestLanguageOptions(runtime = globalThis.chrome?.runtime, apiKey) {
  return new Promise((resolve, reject) => {
    runtime.sendMessage(
      { type: MessageType.GET_LANGUAGE_OPTIONS, payload: { apiKey } },
      (response) => {
        if (runtime.lastError) {
          reject(new Error(runtime.lastError.message));
          return;
        }

        if (response?.type === MessageType.LANGUAGE_OPTIONS_RESULT) {
          resolve(response.payload);
          return;
        }

        reject(new Error(response?.payload?.message ?? "Unable to load DeepL languages."));
      }
    );
  });
}
