const FREE_BASE_URL = "https://api-free.deepl.com";
const PRO_BASE_URL  = "https://api.deepl.com";

function deeplBaseUrl(apiKey) {
  return apiKey.endsWith(":fx") ? FREE_BASE_URL : PRO_BASE_URL;
}

/**
 * @param {string} text
 * @param {string} targetLang  DeepL language code, e.g. "EN", "DE", "ZH"
 * @param {string} apiKey
 * @param {string} [sourceLang] DeepL language code, or "auto" to let DeepL detect it
 * @returns {Promise<{ translation: string, detectedLang: string }>}
 */
export async function fetchTranslation(text, targetLang, apiKey, sourceLang = "auto") {
  const body = { text: [text], target_lang: targetLang };
  if (sourceLang && sourceLang !== "auto") {
    body.source_lang = sourceLang;
  }

  const response = await fetch(`${deeplBaseUrl(apiKey)}/v2/translate`, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new ApiError(response.status, errBody);
  }

  const data = await response.json();
  const [result] = data.translations;
  return {
    translation: result.text,
    detectedLang: result.detected_source_language,
  };
}

/**
 * @param {string} apiKey
 * @returns {Promise<{ sourceLanguages: Array<{ language: string, name: string }>, targetLanguages: Array<{ language: string, name: string }> }>}
 */
export async function fetchTranslationLanguages(apiKey) {
  const response = await fetch(`${deeplBaseUrl(apiKey)}/v3/languages?resource=translate_text`, {
    method: "GET",
    headers: {
      "Authorization": `DeepL-Auth-Key ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new ApiError(response.status, errBody);
  }

  const languages = await response.json();
  return {
    sourceLanguages: languages
      .filter((language) => language.usable_as_source)
      .map(toLanguageOption),
    targetLanguages: languages
      .filter((language) => language.usable_as_target)
      .map(toLanguageOption),
  };
}

export class ApiError extends Error {
  constructor(status, body) {
    super(`DeepL API error ${status}: ${body}`);
    this.status = status;
  }
}

function toLanguageOption({ lang, name }) {
  return {
    language: lang,
    name,
  };
}
