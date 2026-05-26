import { installSelectionTranslator } from "./selection-translator.js";
import { createInviteToast } from "./components/invite-toast.js";

let translator = null;
const inviteToast = isTopLevelFrame()
  ? createInviteToast({
      onAccept: () => {
        translator?.setEnabled(true);
      },
    })
  : null;

translator = installSelectionTranslator({
  enabled: false,
  onInviteRequest: () => {
    inviteToast?.showInvite();
  },
  onEnabledChange: () => {
    inviteToast?.remove();
  },
});

inviteToast?.showInvite();

function isTopLevelFrame(win = window) {
  try {
    return win.top === win.self;
  } catch (err) {
    return false;
  }
}
