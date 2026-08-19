(function () {
  "use strict";

  let ctx = null;
  let loopTimer = null;
  let usingFallback = false;

  function ensureContext() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function startFallbackBeat() {
    const audioCtx = ensureContext();
    if (!audioCtx || loopTimer) return;

    usingFallback = true;
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const bpm = 86;
    const beatSec = 60 / bpm;

    function scheduleKick(time) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(55, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.45, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + 0.4);
    }

    function scheduleHat(time) {
      const bufferSize = audioCtx.sampleRate * 0.04;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 7000;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      src.start(time);
      src.stop(time + 0.05);
    }

    let step = 0;
    function tick() {
      const now = audioCtx.currentTime + 0.05;
      scheduleKick(now);
      if (step % 2 === 0) scheduleHat(now + 0.01);
      step += 1;
      loopTimer = setTimeout(tick, beatSec * 1000);
    }

    tick();
  }

  function stopFallbackBeat() {
    if (loopTimer) {
      clearTimeout(loopTimer);
      loopTimer = null;
    }
  }

  window.BDayAudio = {
    beatEl: null,
    started: false,
    volume: 0.55,

    init(beatPath, volume) {
      this.volume = typeof volume === "number" ? volume : 0.55;
      this.beatEl = document.createElement("audio");
      this.beatEl.loop = true;
      this.beatEl.preload = "auto";
      this.beatEl.volume = this.volume;
      this.beatEl.src = beatPath;
      document.body.appendChild(this.beatEl);

      this.beatEl.addEventListener("error", () => {
        if (!this.started) return;
        startFallbackBeat();
      });
    },

    async start() {
      if (this.started) return;
      this.started = true;

      const audioCtx = ensureContext();
      if (audioCtx && audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      try {
        await this.beatEl.play();
      } catch (_) {
        startFallbackBeat();
      }
    },

    fadeOut(ms) {
      if (!this.beatEl) return;
      const steps = 20;
      const interval = ms / steps;
      let current = this.beatEl.volume;
      const delta = current / steps;
      const timer = setInterval(() => {
        current = Math.max(0, current - delta);
        this.beatEl.volume = current;
        if (current <= 0) {
          clearInterval(timer);
          this.beatEl.pause();
          stopFallbackBeat();
        }
      }, interval);
    },

    boost() {
      if (usingFallback || !this.beatEl) return;
      this.beatEl.volume = Math.min(1, this.volume + 0.15);
    }
  };
})();
