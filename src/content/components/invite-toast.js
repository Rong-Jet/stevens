const TOAST_ID = "stevens-invite-toast";
const LOGO_PATH = "assets/logo.png";

export function createInviteToast({
  root = document,
  runtime = globalThis.chrome?.runtime,
  inviteDurationMs = 5000,
  successDurationMs = 2000,
  onAccept,
} = {}) {
  let timer = null;

  function showInvite() {
    clearTimer();
    const el = renderToast("Invite Stevens?", "stevens-invite-toast-invite");
    el.addEventListener("click", handleInviteClick, { once: true });
    timer = setTimeout(remove, inviteDurationMs);
  }

  function showSuccess() {
    clearTimer();
    renderToast("Stevens is here.", "stevens-invite-toast-success");
    timer = setTimeout(remove, successDurationMs);
  }

  function handleInviteClick() {
    clearTimer();
    onAccept?.();
    showSuccess();
  }

  function renderToast(message, stateClass) {
    remove();
    const el = root.createElement("button");
    el.id = TOAST_ID;
    el.className = `stevens-invite-toast ${stateClass}`;
    el.type = "button";
    el.innerHTML = `
      <img class="stevens-invite-logo" alt="" src="${escapeHtml(getLogoUrl())}" />
      <span>${escapeHtml(message)}</span>
    `;
    root.body.appendChild(el);
    return el;
  }

  function remove() {
    clearTimer();
    root.getElementById(TOAST_ID)?.remove();
  }

  function clearTimer() {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  }

  function getLogoUrl() {
    return runtime?.getURL?.(LOGO_PATH) ?? LOGO_PATH;
  }

  return { showInvite, showSuccess, remove };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
