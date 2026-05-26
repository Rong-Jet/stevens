import { MessageType } from "../messages/types.js";
import { getSelection } from "./utils/selection.js";
import { createBubble, showLoading, showResult, showError, removeBubble } from "./components/bubble.js";

const DEFAULT_SELECTION_CHANGE_DELAY_MS = 150;
const DEFAULT_PDF_SELECTION_POLL_INTERVAL_MS = 500;
const DEFAULT_PDF_SELECTION_STABLE_POLLS = 2;
const DEFAULT_FALLBACK_TOP = 24;
const PDF_FALLBACK_TOP_WITH_INVITE_TOAST = 68;

const defaultBubbleView = {
  createBubble,
  showLoading,
  showResult,
  showError,
  removeBubble,
};

export function installSelectionTranslator({
  root = document,
  runtime = globalThis.chrome?.runtime,
  selectionReader = getSelection,
  bubbleView = defaultBubbleView,
  selectionChangeDelayMs = DEFAULT_SELECTION_CHANGE_DELAY_MS,
  pdfSelectionPollingEnabled,
  pdfSelectionPollIntervalMs = DEFAULT_PDF_SELECTION_POLL_INTERVAL_MS,
  pdfSelectionStablePolls = DEFAULT_PDF_SELECTION_STABLE_POLLS,
  enabled = true,
  onInviteRequest,
  onEnabledChange,
} = {}) {
  let isEnabled = Boolean(enabled);
  let bubble = null;
  let bubbleSource = null;
  let activeSelectionKey = null;
  let selectionTimer = null;
  let pollTimer = null;
  let pendingPolledSelectionKey = null;
  let stablePollCount = 0;
  let pdfFallbackBubblePosition = null;
  const shouldPollPdfSelection = pdfSelectionPollingEnabled ?? isPdfLikeContext(root);

  if (isEnabled) startPdfSelectionPolling();

  runtime?.onMessage?.addListener?.(handleRuntimeMessage);

  function startPdfSelectionPolling() {
    if (!shouldPollPdfSelection || pollTimer) return;
    pollTimer = setInterval(pollCurrentSelection, pdfSelectionPollIntervalMs);
  }

  function stopPdfSelectionPolling() {
    if (!pollTimer) return;
    clearInterval(pollTimer);
    pollTimer = null;
    pendingPolledSelectionKey = null;
    stablePollCount = 0;
  }

  function setEnabled(nextEnabled) {
    isEnabled = Boolean(nextEnabled);
    if (isEnabled) {
      startPdfSelectionPolling();
    } else {
      stopPdfSelectionPolling();
      hideBubble();
    }
    onEnabledChange?.(isEnabled);
    return isEnabled;
  }

  function clearSelectionTimer() {
    if (!selectionTimer) return;
    clearTimeout(selectionTimer);
    selectionTimer = null;
  }

  function hideBubble() {
    clearSelectionTimer();
    bubbleView.removeBubble();
    bubble = null;
    bubbleSource = null;
    activeSelectionKey = null;
  }

  function isInsideBubble(target) {
    return Boolean(target?.closest?.("#stevens-bubble"));
  }

  function hasBubbleFocus() {
    return Boolean(root.activeElement?.closest?.("#stevens-bubble"));
  }

  function translateCurrentSelection() {
    if (!isEnabled) return;
    clearSelectionTimer();

    const selection = readCurrentSelection();
    if (!selection) {
      hideBubble();
      return;
    }

    translateSelection(selection);
  }

  function translateSelection(selection) {
    if (!isEnabled) return;
    const selectionKey = getSelectionKey(selection);
    if (bubble && activeSelectionKey === selectionKey) {
      return;
    }

    bubble = bubbleView.createBubble();
    bubbleSource = "selection";
    activeSelectionKey = selectionKey;
    bubbleView.showLoading(bubble, selection.rect);

    // Extension was reloaded/updated; this tab's content script is stale.
    if (!runtime?.id) {
      bubbleView.showError(bubble, "Extension was updated. Please refresh this page.");
      return;
    }

    try {
      runtime.sendMessage(
        { type: MessageType.TRANSLATE, payload: { text: selection.text } },
        (response) => {
          if (runtime.lastError) {
            if (bubble) bubbleView.showError(bubble, "Extension was updated. Please refresh this page.");
            return;
          }
          if (!bubble) return;
          if (response?.type === MessageType.TRANSLATE_RESULT) {
            bubbleView.showResult(bubble, response.payload, selection.text);
          } else {
            bubbleView.showError(bubble, response?.payload?.message ?? "Something went wrong.");
          }
        }
      );
    } catch (err) {
      bubbleView.showError(bubble, "Extension was updated. Please refresh this page.");
    }
  }

  function pollCurrentSelection() {
    if (!isEnabled) return;
    if (root.visibilityState === "hidden") return;

    const selection = readCurrentSelection();
    if (!selection) {
      pendingPolledSelectionKey = null;
      stablePollCount = 0;
      if (bubble && bubbleSource === "selection") hideBubble();
      return;
    }

    const selectionKey = getSelectionKey(selection);
    if (selectionKey === activeSelectionKey) return;

    if (pendingPolledSelectionKey !== selectionKey) {
      pendingPolledSelectionKey = selectionKey;
      stablePollCount = 1;
      return;
    }

    stablePollCount += 1;
    if (stablePollCount < pdfSelectionStablePolls) return;

    translateSelection(selection);
  }

  function readCurrentSelection() {
    try {
      return selectionReader();
    } catch (err) {
      return null;
    }
  }

  function handleRuntimeMessage(message, _sender, sendResponse) {
    if (message?.type === MessageType.GET_STEVENS_STATE) {
      sendResponse?.({ type: MessageType.STEVENS_STATE_RESULT, payload: { enabled: isEnabled } });
      return false;
    }

    if (message?.type === MessageType.SET_STEVENS_ENABLED) {
      const nextEnabled = setEnabled(message.payload?.enabled);
      sendResponse?.({ type: MessageType.STEVENS_STATE_RESULT, payload: { enabled: nextEnabled } });
      return false;
    }

    if (message?.type === MessageType.SHOW_STEVENS_INVITE) {
      if (!isEnabled) onInviteRequest?.();
      sendResponse?.({ type: MessageType.STEVENS_STATE_RESULT, payload: { enabled: isEnabled } });
      return false;
    }

    if (message?.type === MessageType.DISPLAY_TRANSLATION_RESULT) {
      if (!isEnabled) {
        onInviteRequest?.();
        return false;
      }
      displayExternalResult(message.payload);
      return false;
    }

    if (message?.type === MessageType.DISPLAY_TRANSLATION_ERROR) {
      if (!isEnabled) {
        onInviteRequest?.();
        return false;
      }
      displayExternalError(message.payload);
      return false;
    }

    return false;
  }

  function displayExternalResult({ originalText, result }) {
    bubble = bubbleView.createBubble();
    bubbleSource = "external";
    activeSelectionKey = null;
    const fallbackRect = getFallbackRect(root, { reserveInviteToast: shouldPollPdfSelection });
    const displayOptions = getPdfFallbackDisplayOptions(fallbackRect);

    if (displayOptions) {
      bubbleView.showLoading(bubble, fallbackRect, displayOptions);
      bubbleView.showResult(bubble, result, originalText, displayOptions);
      return;
    }

    bubbleView.showLoading(bubble, fallbackRect);
    bubbleView.showResult(bubble, result, originalText);
  }

  function displayExternalError({ message }) {
    bubble = bubbleView.createBubble();
    bubbleSource = "external";
    activeSelectionKey = null;
    const fallbackRect = getFallbackRect(root, { reserveInviteToast: shouldPollPdfSelection });
    const displayOptions = getPdfFallbackDisplayOptions(fallbackRect);

    if (displayOptions) {
      bubbleView.showLoading(bubble, fallbackRect, displayOptions);
      bubbleView.showError(bubble, message, displayOptions);
      return;
    }

    bubbleView.showLoading(bubble, fallbackRect);
    bubbleView.showError(bubble, message);
  }

  function getPdfFallbackDisplayOptions(fallbackRect) {
    if (!shouldPollPdfSelection) return null;

    pdfFallbackBubblePosition ??= {
      left: fallbackRect.left,
      top: fallbackRect.top,
    };

    return {
      movable: true,
      position: pdfFallbackBubblePosition,
      onPositionChange: (position) => {
        pdfFallbackBubblePosition = position;
      },
    };
  }

  function scheduleSelectionCheck() {
    if (!isEnabled) return;
    if (hasBubbleFocus()) return;
    clearSelectionTimer();
    selectionTimer = setTimeout(translateCurrentSelection, selectionChangeDelayMs);
  }

  function handleMouseUp(event) {
    if (!isEnabled) return;
    if (isInsideBubble(event.target)) return;
    translateCurrentSelection();
  }

  function handleMouseDown(event) {
    if (!isEnabled) return;
    if (isInsideBubble(event.target)) return;
    hideBubble();
  }

  root.addEventListener("mouseup", handleMouseUp, true);
  root.addEventListener("mousedown", handleMouseDown, true);
  root.addEventListener("selectionchange", scheduleSelectionCheck);

  function uninstallSelectionTranslator() {
    clearSelectionTimer();
    stopPdfSelectionPolling();
    runtime?.onMessage?.removeListener?.(handleRuntimeMessage);
    root.removeEventListener("mouseup", handleMouseUp, true);
    root.removeEventListener("mousedown", handleMouseDown, true);
    root.removeEventListener("selectionchange", scheduleSelectionCheck);
  }

  uninstallSelectionTranslator.setEnabled = setEnabled;
  uninstallSelectionTranslator.isEnabled = () => isEnabled;
  return uninstallSelectionTranslator;
}

function getSelectionKey({ text, rect }) {
  return [
    text,
    Math.round(rect.left),
    Math.round(rect.top),
    Math.round(rect.right),
    Math.round(rect.bottom),
  ].join(":");
}

function isPdfLikeContext(root) {
  const href = root.location?.href ?? root.defaultView?.location?.href ?? "";
  const contentType = root.contentType ?? "";

  if (contentType.toLowerCase().includes("pdf")) return true;
  if (href.toLowerCase().includes(".pdf")) return true;

  try {
    return Boolean(root.querySelector?.('embed[type="application/pdf"], object[type="application/pdf"], iframe[src*=".pdf"]'));
  } catch (err) {
    return false;
  }
}

function getFallbackRect(root, { reserveInviteToast = false } = {}) {
  const width = root.defaultView?.innerWidth ?? 360;
  const left = Math.max(8, Math.round((width - 320) / 2));
  const top = reserveInviteToast ? PDF_FALLBACK_TOP_WITH_INVITE_TOAST : DEFAULT_FALLBACK_TOP;

  return {
    left,
    top,
    right: left,
    bottom: top,
  };
}
