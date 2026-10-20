/*=============== WORK IN PROGRESS GATE ===============
   Save as assets/js/wip-gate.js

   Loaded in the <head> of index.html (and the project pages).
   While WIP_MODE is true, visitors are sent to wip.html instead.

   Preview the real site yourself:
     yoursite/index.html?preview=on    (remembered in this browser)
     yoursite/index.html?preview=off   (turn the gate back on for you)

   TO LAUNCH: set WIP_MODE to false. (Later, remove the script tags + wip files.) */
(() => {
  const WIP_MODE = true;
  if (!WIP_MODE) return;

  const KEY = "wip-preview";

  try {
    const flag = new URLSearchParams(window.location.search).get("preview");
    if (flag === "on") localStorage.setItem(KEY, "1");
    if (flag === "off") localStorage.removeItem(KEY);
    if (localStorage.getItem(KEY) === "1") return; // owner preview: show the real site
  } catch (e) {
    /* storage blocked: fall through and show the WIP page */
  }

  // This file lives at <site root>/assets/js/wip-gate.js, so the root is two levels up.
  // Works on GitHub Pages sub-paths (user.github.io/repo/) and on custom domains.
  const script = document.currentScript;
  const root = script ? new URL("../../", script.src) : new URL("/", window.location.href);

  window.location.replace(new URL("wip.html", root).href);
})();