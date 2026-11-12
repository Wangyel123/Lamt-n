// "This is my own phone": a small cookie that turns off the idle sign-out on that device for
// OWN_DEVICE_DAYS. Not secret (it holds no identity), so the browser can read it too.
// Shared school computers never get it, so they keep the 10-minute sign-out.

import { OWN_DEVICE_DAYS } from "./accessCodes";

export const OWN_DEVICE_COOKIE = "lamton-own-device";

/** Browser only. */
export function isOwnDevice(): boolean {
  return document.cookie.split("; ").some((c) => c === `${OWN_DEVICE_COOKIE}=1`);
}

/** Browser only (demo mode sets it here; live mode sets it on the server). */
export function setOwnDevice(on: boolean) {
  document.cookie = on
    ? `${OWN_DEVICE_COOKIE}=1; max-age=${OWN_DEVICE_DAYS * 24 * 60 * 60}; path=/; samesite=lax`
    : `${OWN_DEVICE_COOKIE}=; max-age=0; path=/; samesite=lax`;
}
