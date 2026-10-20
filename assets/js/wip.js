/*=============== WORK IN PROGRESS PAGE ===============
   Save as assets/js/wip.js (delete it when you launch) */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /*=============== PROGRESS BAR ===============*/
  const progress = document.querySelector(".wip__progress");
  const fill = document.getElementById("wip-fill");
  const pctEl = document.getElementById("wip-pct");

  if (progress && fill && pctEl) {
    const target = Math.min(100, Math.max(0, Number(progress.dataset.progress) || 0));

    if (reduceMotion) {
      fill.style.width = `${target}%`;
      pctEl.textContent = `${target}%`;
    } else {
      // start after the entrance animation so the fill is visible
      setTimeout(() => {
        fill.style.width = `${target}%`;

        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          pctEl.textContent = `${Math.round(target * eased)}%`;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, 700);
    }
  }

  /*=============== TERMINAL TYPING ===============*/
  const terminal = document.getElementById("wip-terminal");
  if (!terminal) return;

  const lines = [...terminal.querySelectorAll(".wip__line")];
  const cursor = document.createElement("span");
  cursor.className = "wip__cursor";

  // idle prompt with the blinking cursor, shown after the commands
  const idle = document.createElement("div");
  idle.className = "wip__line wip__line--idle";
  idle.innerHTML = '<span class="wip__prompt">prashant@linux:~$</span> ';
  idle.appendChild(cursor);

  if (reduceMotion || !lines.length) {
    // keep the static text, just add the idle prompt
    terminal.appendChild(idle);
    return;
  }

  // read the text, then blank it so it can be typed out
  const data = lines.map((line) => {
    const cmd = line.querySelector(".wip__cmd");
    const out = line.querySelector(".wip__out");
    const item = { line, cmd, out, cmdText: cmd.textContent, outText: out.textContent };
    cmd.textContent = "";
    out.textContent = "";
    out.style.display = "none";
    line.style.display = "none";
    return item;
  });

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const typeInto = async (el, text, speed) => {
    for (const ch of text) {
      el.textContent += ch;
      await wait(speed);
    }
  };

  (async () => {
    await wait(900);
    for (const d of data) {
      d.line.style.display = "";
      d.cmd.after(cursor);
      await typeInto(d.cmd, d.cmdText, 55);
      await wait(350);

      d.out.style.display = "";
      d.out.after(cursor);
      await typeInto(d.out, d.outText, 22);
      await wait(500);
    }
    terminal.appendChild(idle);
  })();
})();