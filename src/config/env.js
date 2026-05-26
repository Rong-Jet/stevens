export function getLocalDeepLApiKey() {
  const key = globalThis.__STEVENS_LOCAL_DEEPL_API_KEY__;
  return typeof key === "string" ? key.trim() : "";
}
