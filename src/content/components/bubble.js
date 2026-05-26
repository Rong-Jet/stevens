import { speak, toBCP47 } from "../utils/speech.js";

const BUBBLE_ID = "stevens-bubble";

export function createBubble() {
  removeBubble();
  const el = document.createElement("div");
  el.id = BUBBLE_ID;
  el.className = "stevens-bubble";
  document.body.appendChild(el);
  return el;
}

export function showLoading(el, rect) {
  el.innerHTML = `<span class="stevens-loading">Translating…</span>`;
  positionBubble(el, rect);
  el.classList.remove("stevens-hidden");
}

export function showResult(el, { translation, detectedLang, sourceLang }, originalText) {
  const spokenLang = sourceLang && sourceLang !== "auto" ? sourceLang : detectedLang;
  const lang = toBCP47(spokenLang);
  const spokenText = originalText ?? translation;
  el.innerHTML = `
    <div class="stevens-translation">${escapeHtml(translation)}</div>
    <div class="stevens-meta">
      <span class="stevens-lang">${escapeHtml(detectedLang)}</span>
      <button class="stevens-speak-btn" aria-label="Pronounce selected text" title="Pronounce selected text">&#128266;</button>
    </div>
  `;
  el.querySelector(".stevens-speak-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    speak(spokenText, lang);
  });
}

export function showError(el, message) {
  el.innerHTML = `<span class="stevens-error">${escapeHtml(message)}</span>`;
}

export function removeBubble() {
  document.getElementById(BUBBLE_ID)?.remove();
}

function positionBubble(el, rect) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const margin = 8;

  el.style.left = `${rect.left + scrollX}px`;
  el.style.top = `${rect.bottom + scrollY + margin}px`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
