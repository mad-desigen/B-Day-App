(function () {
  "use strict";

  const stage = document.getElementById("stage");

  let story = null;
  let sceneIndex = 0;
  let activeSceneEl = null;
  let transitioning = false;

  function h(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function labelFromPath(path) {
    const parts = path.split("/");
    return parts[parts.length - 1].replace(/\.[^.]+$/, "").toUpperCase();
  }

  function mediaBg(parent, src, filter, placeholderLabel) {
    const bg = h("div", "scene__bg" + (filter === "nostalgia" ? " scene__bg--nostalgia" : ""));
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.src = src;
    img.addEventListener("error", () => {
      bg.classList.add("scene__bg--placeholder");
      bg.innerHTML = "";
      bg.appendChild(h("span", "", placeholderLabel || labelFromPath(src)));
    });
    bg.appendChild(img);
    parent.appendChild(bg);
    parent.appendChild(h("div", "scene__overlay"));
    return bg;
  }

  function mediaVideo(parent, src, placeholderLabel) {
    const bg = h("div", "scene__bg");
    const video = document.createElement("video");
    video.src = src;
    video.playsInline = true;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.addEventListener("error", () => {
      bg.classList.add("scene__bg--placeholder");
      bg.innerHTML = "";
      bg.appendChild(h("span", "", placeholderLabel || labelFromPath(src)));
    });
    bg.appendChild(video);
    parent.appendChild(bg);
    parent.appendChild(h("div", "scene__overlay"));
    return { bg, video };
  }

  function nextButton(label, onClick) {
    const btn = h("button", "btn-primary", label || "NEXT ›");
    btn.type = "button";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function goNext(delay) {
    if (transitioning) return;
    const wait = typeof delay === "number" ? delay : 0;
    setTimeout(() => {
      sceneIndex += 1;
      if (sceneIndex >= story.scenes.length) return;
      renderScene(story.scenes[sceneIndex]);
    }, wait);
  }

  function exitThen(fn) {
    transitioning = true;
    if (activeSceneEl) {
      activeSceneEl.classList.remove("is-active");
      activeSceneEl.classList.add("is-exiting");
    }
    setTimeout(() => {
      if (activeSceneEl) activeSceneEl.remove();
      transitioning = false;
      fn();
    }, 420);
  }

  function mountScene(renderFn) {
    exitThen(() => {
      const direction = sceneIndex % 2 === 0 ? "" : " scene--reverse";
      const el = h("div", "scene" + direction);
      renderFn(el);
      stage.appendChild(el);
      requestAnimationFrame(() => el.classList.add("is-active"));
      activeSceneEl = el;
    });
  }

  function renderTapStart(scene) {
    mountScene((el) => {
      const content = h("div", "scene__content");
      content.appendChild(h("p", "display-md", story.meta.title));
      content.appendChild(h("p", "hint", scene.hint || ""));
      content.appendChild(nextButton(scene.label, async () => {
        await BDayAudio.start();
        goNext();
      }));
      el.appendChild(content);
    });
  }

  function renderTitle(scene) {
    mountScene((el) => {
      const content = h("div", "scene__content title-glitch");
      content.appendChild(h("p", "display-xl line-1", story.meta.title));
      content.appendChild(h("p", "display-lg line-2", story.meta.name.toUpperCase()));
      el.appendChild(content);
      setTimeout(() => goNext(), scene.duration || 2600);
    });
  }

  function renderPhoto(scene) {
    mountScene((el) => {
      mediaBg(el, scene.image, scene.filter, labelFromPath(scene.image));
      const content = h("div", "scene__content");
      if (scene.tag) content.appendChild(h("span", "tag", scene.tag));
      el.appendChild(content);
      setTimeout(() => goNext(), scene.duration || 1900);
    });
  }

  function renderChapter(scene) {
    mountScene((el) => {
      const content = h("div", "scene__content");
      content.appendChild(h("p", "display-lg", scene.text));
      el.appendChild(content);
      setTimeout(() => goNext(), scene.duration || 900);
    });
  }

  function renderMontage(scene) {
    const items = scene.items || [];
    const itemDuration = scene.itemDuration || 1900;

    function showItem(el, idx) {
      const item = items[idx];
      if (!item) {
        goNext();
        return;
      }

      el.innerHTML = "";
      el.className = "scene is-active";

      if (item.kind === "video") {
        const { video } = mediaVideo(el, item.src, labelFromPath(item.src));
        if (video) video.play().catch(() => {});
      } else {
        mediaBg(el, item.src, "none", labelFromPath(item.src));
      }

      setTimeout(() => showItem(el, idx + 1), itemDuration);
    }

    mountScene((el) => {
      showItem(el, 0);
    });
  }

  function renderTextHit(scene) {
    mountScene((el) => {
      const content = h("div", "scene__content");
      content.appendChild(h("p", "display-md", scene.line));
      content.appendChild(h("p", "btn-word", scene.word));
      el.appendChild(content);
      setTimeout(() => goNext(), scene.duration || 1800);
    });
  }

  function renderCountdown(scene) {
    mountScene((el) => {
      BDayAudio.boost();
      const content = h("div", "scene__content");
      if (scene.text) content.appendChild(h("p", "display-md", scene.text));
      const numEl = h("p", "countdown-num", String(scene.from || 3));
      content.appendChild(numEl);
      el.appendChild(content);

      let n = scene.from || 3;
      const timer = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearInterval(timer);
          goNext(200);
          return;
        }
        numEl.textContent = String(n);
        numEl.style.animation = "none";
        void numEl.offsetWidth;
        numEl.style.animation = "count-pop 0.5s ease";
      }, 800);
    });
  }

  function renderHold(scene) {
    mountScene((el) => {
      const content = h("div", "scene__content");
      const btn = h("button", "btn-hold");
      btn.type = "button";
      const fill = h("div", "btn-hold__fill");
      const label = h("span", "btn-hold__label", scene.label);
      btn.appendChild(fill);
      btn.appendChild(label);
      content.appendChild(btn);
      el.appendChild(content);

      const ms = scene.ms || 2000;
      let start = 0;
      let raf = 0;
      let done = false;

      function progress(now) {
        if (!start) start = now;
        const pct = Math.min(100, ((now - start) / ms) * 100);
        fill.style.width = pct + "%";
        if (pct >= 100 && !done) {
          done = true;
          label.textContent = scene.success || "UNLOCKED";
          document.getElementById("app").classList.add("shake");
          setTimeout(() => {
            document.getElementById("app").classList.remove("shake");
            goNext(400);
          }, 500);
          return;
        }
        if (!done) raf = requestAnimationFrame(progress);
      }

      function begin() {
        if (done) return;
        start = 0;
        raf = requestAnimationFrame(progress);
      }

      function end() {
        if (done) return;
        cancelAnimationFrame(raf);
        start = 0;
        fill.style.width = "0%";
      }

      btn.addEventListener("touchstart", (e) => { e.preventDefault(); begin(); });
      btn.addEventListener("touchend", end);
      btn.addEventListener("touchcancel", end);
      btn.addEventListener("mousedown", begin);
      btn.addEventListener("mouseup", end);
      btn.addEventListener("mouseleave", end);
    });
  }

  function renderFlash(scene) {
    mountScene((el) => {
      const images = scene.images || [];
      const interval = scene.intervalMs || 280;
      images.forEach((src, i) => {
        const frame = h("div", "flash-frame" + (i === 0 ? " is-on" : ""));
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.addEventListener("error", () => {
          frame.classList.add("scene__bg--placeholder");
          frame.innerHTML = "";
          frame.appendChild(h("span", "", labelFromPath(src)));
        });
        frame.appendChild(img);
        el.appendChild(frame);
      });

      let idx = 0;
      const frames = el.querySelectorAll(".flash-frame");
      const timer = setInterval(() => {
        frames[idx]?.classList.remove("is-on");
        idx += 1;
        if (idx >= frames.length) {
          clearInterval(timer);
          goNext(150);
          return;
        }
        frames[idx]?.classList.add("is-on");
      }, interval);
    });
  }

  function renderDrop(scene) {
    mountScene((el) => {
      BDayAudio.boost();
      const content = h("div", "scene__content");
      content.appendChild(h("p", "drop-18", scene.number || "18"));
      el.appendChild(content);
      setTimeout(() => goNext(), 1800);
    });
  }

  function renderLetter(scene) {
    mountScene((el) => {
      const content = h("div", "scene__content letter");
      const lines = scene.lines || [];
      const lineEls = [];

      lines.forEach((line, i) => {
        let cls = "letter-line";
        if (line === "") cls += " letter-line--empty";
        else if (line === "18." || line === "18") cls += " letter-line--big";
        else if (line === story.meta.name + "." || line === story.meta.name) cls += " letter-line--name";
        const p = h("p", cls, line === "" ? "\u00a0" : line);
        content.appendChild(p);
        lineEls.push(p);
      });

      if (story.meta.signature) {
        const sig = h("p", "letter-line", "— " + story.meta.signature);
        content.appendChild(sig);
        lineEls.push(sig);
      }

      el.appendChild(content);

      let i = 0;
      const reveal = setInterval(() => {
        if (i >= lineEls.length) {
          clearInterval(reveal);
          setTimeout(() => goNext(), 2200);
          return;
        }
        lineEls[i].classList.add("is-visible");
        i += 1;
      }, 450);
    });
  }

  function renderEnd(scene) {
    mountScene((el) => {
      const content = h("div", "scene__content");
      content.appendChild(h("p", "display-md", scene.text));
      if (scene.symbol) content.appendChild(h("p", "end-symbol", scene.symbol));
      el.appendChild(content);
      setTimeout(() => BDayAudio.fadeOut(3000), 1500);
    });
  }

  function renderScene(scene) {
    switch (scene.type) {
      case "tap-start": renderTapStart(scene); break;
      case "title": renderTitle(scene); break;
      case "photo": renderPhoto(scene); break;
      case "chapter": renderChapter(scene); break;
      case "montage": renderMontage(scene); break;
      case "text-hit": renderTextHit(scene); break;
      case "countdown": renderCountdown(scene); break;
      case "hold": renderHold(scene); break;
      case "flash": renderFlash(scene); break;
      case "drop": renderDrop(scene); break;
      case "letter": renderLetter(scene); break;
      case "end": renderEnd(scene); break;
      default:
        goNext();
    }
  }

  async function init() {
    try {
      const res = await fetch("data/story.json?v=20260819-2");
      story = await res.json();
    } catch (e) {
      stage.innerHTML = "<p style='padding:2rem;text-align:center'>story.json konnte nicht geladen werden.</p>";
      return;
    }

    BDayAudio.init(story.audio.beat, story.audio.volume);
    sceneIndex = 0;
    renderScene(story.scenes[0]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
