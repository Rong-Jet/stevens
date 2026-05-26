/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { createInviteToast } from "../../src/content/components/invite-toast.js";

describe("createInviteToast", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should show an invite toast with the Stevens logo and remove it after five seconds", () => {
    const toast = createInviteToast({
      root: document,
      runtime: { getURL: (path) => `chrome-extension://stevens/${path}` },
      inviteDurationMs: 5000,
      successDurationMs: 2000,
      onAccept: jest.fn(),
    });

    toast.showInvite();

    const el = document.getElementById("stevens-invite-toast");
    expect(el.textContent).toContain("Invite Stevens?");
    expect(el.querySelector("img").src).toBe("chrome-extension://stevens/assets/logo.png");

    jest.advanceTimersByTime(4999);
    expect(document.getElementById("stevens-invite-toast")).not.toBeNull();

    jest.advanceTimersByTime(1);
    expect(document.getElementById("stevens-invite-toast")).toBeNull();
  });

  it("should turn into a two-second success toast when clicked", () => {
    const onAccept = jest.fn();
    const toast = createInviteToast({
      root: document,
      runtime: { getURL: (path) => `chrome-extension://stevens/${path}` },
      inviteDurationMs: 5000,
      successDurationMs: 2000,
      onAccept,
    });

    toast.showInvite();
    document.getElementById("stevens-invite-toast").click();

    const el = document.getElementById("stevens-invite-toast");
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(el.textContent).toContain("Stevens is here.");
    expect(el.classList.contains("stevens-invite-toast-success")).toBe(true);

    jest.advanceTimersByTime(1999);
    expect(document.getElementById("stevens-invite-toast")).not.toBeNull();

    jest.advanceTimersByTime(1);
    expect(document.getElementById("stevens-invite-toast")).toBeNull();
  });

  it("should style the success toast with a solid green darker than the border", async () => {
    const css = await readFile("src/content/styles/bubble.css", "utf8");

    expect(css).toMatch(/\.stevens-invite-toast-success\s*\{[^}]*background:\s*#16a34a;/s);
    expect(css).toMatch(/\.stevens-invite-toast-success\s*\{[^}]*border-color:\s*#22c55e;/s);
  });
});
