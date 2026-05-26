import { fetchTranslationLanguages } from "./api.js";
import { getSettings } from "./storage.js";

export class LanguageServiceError extends Error {}

export async function getTranslationLanguages(apiKeyOverride) {
  const settings = apiKeyOverride ? {} : await getSettings();
  const apiKey = apiKeyOverride?.trim() || settings.apiKey;

  if (!apiKey) {
    throw new LanguageServiceError("No API key configured.");
  }

  try {
    return await fetchTranslationLanguages(apiKey);
  } catch (err) {
    throw new LanguageServiceError("Unable to load DeepL languages.");
  }
}
