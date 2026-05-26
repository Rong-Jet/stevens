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

export function showLoading(el, rect, options = {}) {
  setMovableClass(el, options);
  el.innerHTML = `${getDragHandleHtml(options)}<span class="stevens-loading">Translating…</span>`;
  positionBubble(el, rect, options);
  attachDragBehavior(el, options);
  el.classList.remove("stevens-hidden");
}

export function showResult(el, { translation, detectedLang, sourceLang }, originalText, options = {}) {
  setMovableClass(el, options);
  const spokenLang = sourceLang && sourceLang !== "auto" ? sourceLang : detectedLang;
  const lang = toBCP47(spokenLang);
  const spokenText = originalText ?? translation;
  el.innerHTML = `${getDragHandleHtml(options)}
    <div class="stevens-translation">${escapeHtml(translation)}</div>
    <div class="stevens-meta">
      <span class="stevens-lang">${escapeHtml(detectedLang)}</span>
      <button class="stevens-speak-btn" aria-label="Pronounce selected text" title="Pronounce selected text">&#128266;</button>
    </div>
  `;
  positionConfiguredBubble(el, options);
  attachDragBehavior(el, options);
  el.querySelector(".stevens-speak-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    speak(spokenText, lang);
  });
}

export function showError(el, message, options = {}) {
  setMovableClass(el, options);
  el.innerHTML = `${getDragHandleHtml(options)}<span class="stevens-error">${escapeHtml(message)}</span>`;
  positionConfiguredBubble(el, options);
  attachDragBehavior(el, options);
}

export function removeBubble() {
  document.getElementById(BUBBLE_ID)?.remove();
}

function positionBubble(el, rect, options = {}) {
  if (options.position) {
    positionConfiguredBubble(el, options);
    return;
  }

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const margin = 8;

  el.style.left = `${rect.left + scrollX}px`;
  el.style.top = `${rect.bottom + scrollY + margin}px`;
}

function positionConfiguredBubble(el, { position } = {}) {
  if (!position) return;
  setFixedPosition(el, clampPosition(el, position));
}

function getDragHandleHtml({ movable } = {}) {
  if (!movable) return "";

  return `<button class="stevens-drag-handle" type="button" aria-label="Move translation bubble" title="Move translation bubble">&#8942;</button>`;
}

function setMovableClass(el, { movable } = {}) {
  el.classList.toggle("stevens-movable", Boolean(movable));
}

function attachDragBehavior(el, options) {
  const handle = el.querySelector(".stevens-drag-handle");
  if (!handle) return;

  let activeDrag = null;

  handle.addEventListener("pointerdown", (event) => {
    if (activeDrag) return;
    startPointerDrag(event);
  });

  handle.addEventListener("mousedown", (event) => {
    if (activeDrag) return;
    startMouseDrag(event);
  });

  function startDrag(event) {
    event.preventDefault();
    event.stopPropagation();

    const rect = el.getBoundingClientRect();
    activeDrag = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
  }

  function moveBubble(moveEvent) {
    if (!activeDrag) return;
    const nextPosition = clampPosition(el, {
      left: moveEvent.clientX - activeDrag.offsetX,
      top: moveEvent.clientY - activeDrag.offsetY,
    });
    setFixedPosition(el, nextPosition);
    options.onPositionChange?.(nextPosition);
  }

  function stopDrag() {
    activeDrag = null;
  }

  function startPointerDrag(event) {
    startDrag(event);
    const pointerId = event.pointerId;

    handle.setPointerCapture?.(pointerId);

    function handlePointerMove(moveEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      moveBubble(moveEvent);
    }

    function cleanupPointerDrag({ releaseCapture } = {}) {
      handle.removeEventListener("pointermove", handlePointerMove);
      handle.removeEventListener("pointerup", handlePointerEnd);
      handle.removeEventListener("pointercancel", handlePointerEnd);
      handle.removeEventListener("lostpointercapture", handleLostPointerCapture);
      if (releaseCapture) releasePointerCapture(handle, pointerId);
      stopDrag();
    }

    function handlePointerEnd(endEvent) {
      if (endEvent.pointerId !== pointerId) return;
      cleanupPointerDrag({ releaseCapture: true });
    }

    function handleLostPointerCapture(endEvent) {
      if (endEvent.pointerId !== pointerId) return;
      cleanupPointerDrag();
    }

    handle.addEventListener("pointermove", handlePointerMove);
    handle.addEventListener("pointerup", handlePointerEnd);
    handle.addEventListener("pointercancel", handlePointerEnd);
    handle.addEventListener("lostpointercapture", handleLostPointerCapture);
  }

  function startMouseDrag(event) {
    startDrag(event);
    const ownerDocument = el.ownerDocument;

    function handleMouseMove(moveEvent) {
      moveBubble(moveEvent);
    }

    function handleMouseUp() {
      ownerDocument.removeEventListener("mousemove", handleMouseMove, true);
      ownerDocument.removeEventListener("mouseup", handleMouseUp, true);
      stopDrag();
    }

    ownerDocument.addEventListener("mousemove", handleMouseMove, true);
    ownerDocument.addEventListener("mouseup", handleMouseUp, true);
  }
}

function releasePointerCapture(el, pointerId) {
  if (!el.releasePointerCapture) return;
  try {
    el.releasePointerCapture(pointerId);
  } catch (err) {
    // The browser may already have released capture on pointer cancellation.
  }
}

function setFixedPosition(el, position) {
  el.style.position = "fixed";
  el.style.left = `${position.left}px`;
  el.style.top = `${position.top}px`;
}

function clampPosition(el, position) {
  const margin = 8;
  const viewportWidth = window.innerWidth || 360;
  const viewportHeight = window.innerHeight || 240;
  const rect = el.getBoundingClientRect();
  const width = rect.width || el.offsetWidth || 320;
  const height = rect.height || el.offsetHeight || 80;
  const maxLeft = Math.max(margin, viewportWidth - width - margin);
  const maxTop = Math.max(margin, viewportHeight - height - margin);

  return {
    left: Math.min(Math.max(margin, Math.round(position.left)), maxLeft),
    top: Math.min(Math.max(margin, Math.round(position.top)), maxTop),
  };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
