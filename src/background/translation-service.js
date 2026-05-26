import { fetchTranslation, ApiError } from "./api.js";
import { getSettings } from "./storage.js";

const MAX_CHARS = 500;

/**
 * @param {string} text
 * @returns {Promise<{ translation: string, detectedLang: string, targetLang: string, sourceLang: string }>}
 */
export async function translate(text) {
  if (!text || text.trim().length === 0) {
    throw new TranslationServiceError("Text is empty.");
  }
  if (text.length > MAX_CHARS) {
    throw new TranslationServiceError(`Text exceeds ${MAX_CHARS} character limit.`);
  }

  const { apiKey, targetLang, sourceLang = "auto" } = await getSettings();
  if (!apiKey) {
    throw new TranslationServiceError("No API key configured. Open settings to add one.");
  }

  try {
    const result = await fetchTranslation(text.trim(), targetLang, apiKey, sourceLang);
    return { ...result, targetLang, sourceLang };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 403) throw new TranslationServiceError("Invalid API key.");
      if (err.status === 429) throw new TranslationServiceError("Rate limit reached. Try again shortly.");
      if (err.status === 456) throw new TranslationServiceError("Translation quota exceeded.");
      throw new TranslationServiceError(`DeepL error ${err.status} — check your API key and target language.`);
    }
    throw new TranslationServiceError("Translation failed. Check your connection.");
  }
}

export class TranslationServiceError extends Error {}
