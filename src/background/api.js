const FREE_URL = "https://api-free.deepl.com/v2/translate";
const PRO_URL  = "https://api.deepl.com/v2/translate";

function deeplUrl(apiKey) {
  return apiKey.endsWith(":fx") ? FREE_URL : PRO_URL;
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

  const response = await fetch(deeplUrl(apiKey), {
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

export class ApiError extends Error {
  constructor(status, body) {
    super(`DeepL API error ${status}: ${body}`);
    this.status = status;
  }
}
