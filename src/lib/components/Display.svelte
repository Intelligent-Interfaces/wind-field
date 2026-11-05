<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { getWaveform } from "$lib/engine/audio";

  let {
    probabilities = [],
    activeIndex = -1,
    mode = "quantum",
    note = "",
    octave = 4,
  }: {
    probabilities: number[];
    activeIndex?: number;
    mode?: string;
    note?: string;
    octave?: number;
  } = $props();

  let canvas: HTMLCanvasElement;
  let rafId: number;

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#2E3337";
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = "#888";
    ctx.font = "bold 10px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Mode: ${mode.toUpperCase()}`, 8, 16);

    ctx.textAlign = "right";
    ctx.fillStyle = "#888";
    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText(`Octave: ${octave}`, w - 8, 16);

    if (note) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px monospace";
      ctx.fillText(note, w / 2, 16);
    }

    if (probabilities.length === 0) {
      ctx.fillStyle = "#555";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ready", w / 2, h / 2 + 4);
    } else {
      // Probability bars
      const barArea = { x: 10, y: 28, w: w - 20, h: h - 48 };
      const barW = Math.max(4, barArea.w / probabilities.length - 3);
      const gap = 3;
      const totalW = (barW + gap) * probabilities.length - gap;
      const startX = barArea.x + (barArea.w - totalW) / 2;
      const colors = ["#5CB6F2", "#02CA71", "#ECEFF1", "#F97133", "#AB47BC", "#EF5350", "#26C6DA", "#FFEE58"];

      for (let i = 0; i < probabilities.length; i++) {
        const barH = probabilities[i] * barArea.h;
        const x = startX + i * (barW + gap);
        const y = barArea.y + barArea.h - barH;

        ctx.fillStyle = i === activeIndex ? "#fff" : colors[i % colors.length];
        ctx.globalAlpha = i === activeIndex ? 1 : 0.4 + probabilities[i] * 0.6;
        ctx.fillRect(x, y, barW, barH);

        ctx.globalAlpha = 0.7;
        ctx.fillStyle = "#aaa";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        const bits = Math.ceil(Math.log2(probabilities.length || 2));
        ctx.fillText(`|${i.toString(2).padStart(bits, "0")}⟩`, x + barW / 2, barArea.y + barArea.h + 12);
      }
      ctx.globalAlpha = 1;
    }

    // Waveform overlay
    try {
      const waveform = getWaveform().getValue() as Float32Array;
      const waveH = h * 0.28;
      const waveY = h - waveH - 2;

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "#5CB6F2";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#5CB6F2";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      for (let i = 0; i < waveform.length; i++) {
        const x = (i / (waveform.length - 1)) * w;
        const y = waveY + (1 - (waveform[i] + 1) / 2) * waveH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    } catch {
      // analyser not ready yet
    }

    rafId = requestAnimationFrame(draw);
  }

  $effect(() => {
    // re-trigger draw when probabilities change (reactive)
    probabilities; activeIndex; mode; note; octave;
  });

  onMount(() => {
    rafId = requestAnimationFrame(draw);
  });

  onDestroy(() => {
    if (browser) cancelAnimationFrame(rafId);
  });
</script>

<div class="display-housing">
  <canvas bind:this={canvas} class="display-screen"></canvas>
</div>

<style>
  .display-housing {
    background: #2E3337;
    border: 3px solid var(--q-border, #000);
    border-radius: 6px;
    overflow: hidden;
    width: 100%;
    height: 100%;
    padding: 8px;
  }
  .display-screen {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 2px;
  }
</style>
