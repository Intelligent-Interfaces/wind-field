<script lang="ts">
  import Knob from "$lib/components/Knob.svelte";
  import Display from "$lib/components/Display.svelte";
  import ModeSwitch from "$lib/components/ModeSwitch.svelte";
  import PianoKeys from "$lib/components/PianoKeys.svelte";
  import Speaker from "$lib/components/Speaker.svelte";
  import OpButton from "$lib/components/OpButton.svelte";
  import ThemePicker from "$lib/components/ThemePicker.svelte";
  import InfoTooltip from "$lib/components/InfoTooltip.svelte";
  import Composer from "$lib/components/Composer.svelte";
  import { THEMES, type Theme } from "$lib/themes";
  import { INFO, getKnobInfo, type ControlInfo } from "$lib/info";
  import { ensureAudio, playNoteOn, playNoteOff, playSequence, stopAll, loadSample } from "$lib/engine/audio";
  import { runCircuit, generateMelody, type CircuitParams } from "$lib/sonification/quantum";
  import { onMount } from "svelte";

  // ── Background presets (gradient only) ──
  const BG_PRESETS = [
    { name: "transparent", bg: "transparent" },
    ...THEMES.map((t) => ({ name: t.name, bg: t.bg })),
  ];

  let bgIndex = $state(1);
  let frameTheme: Theme = $state(THEMES[0]);
  let showBgPicker = $state(false);
  let showFramePicker = $state(false);

  // ── Info mode ──
  type InfoMode = "off" | "learn" | "explore";
  let infoMode = $state<InfoMode>("off");
  let activeInfo = $state<ControlInfo | null>(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);

  function showInfo(info: ControlInfo, e: MouseEvent) {
    activeInfo = info;
    tooltipX = e.clientX;
    tooltipY = e.clientY;
  }

  function infoClick(key: string | ControlInfo, e: MouseEvent, action?: () => void) {
    if (infoMode === "off") { action?.(); return; }
    const info = typeof key === "string" ? INFO[key] : key;
    if (info) showInfo(info, e);
    if (infoMode === "explore") action?.();
  }

  const INFO_MODE_LABELS: Record<InfoMode, string> = {
    off: "info: off",
    learn: "learn",
    explore: "explore",
  };

  function cycleInfoMode() {
    infoMode = infoMode === "off" ? "learn" : infoMode === "learn" ? "explore" : "off";
    activeInfo = null;
  }

  function shuffleThemes() {
    bgIndex = Math.floor(Math.random() * BG_PRESETS.length);
    frameTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
  }

  // ── Morph levels ──
  // 0 = full UI          → 17col × 6row, 1645 × 594
  // 1 = essentials        → hide numbered btns, bottom-left → 1645 × 396 (4 rows)
  // 2 = minimal           → also hide speaker/nav/COM/transport → 1100 × 396
  // 3 = core              → display + knobs only → 1100 × 198 (2 rows)
  const MORPH_LABELS = ["full", "essentials spaced", "essentials compact", "minimal", "core"];
  const MORPH_SIZES: Array<{ w: number; h: number; cols: number; rows: number }> = [
    { w: 1645, h: 594, cols: 17, rows: 6 },
    { w: 1645, h: 512, cols: 17, rows: 5 },
    { w: 1645, h: 430, cols: 17, rows: 4 },
    { w: 1100, h: 430, cols: 12, rows: 4 },
    { w: 1100, h: 240, cols: 12, rows: 2 },
  ];
  let morphLevel = $state(0);
  let morphSize = $derived(MORPH_SIZES[morphLevel]);
  function cycleMorph() {
    morphLevel = (morphLevel + 1) % MORPH_LABELS.length;
  }

  // ── Explode mode ──
  let exploded = $state(false);
  function toggleExplode() {
    exploded = !exploded;
    composing = false;
    if (exploded) morphLevel = 0;
  }

  // ── Compose mode ──
  let composing = $state(false);
  function toggleCompose() {
    composing = !composing;
    exploded = false;
    if (composing) morphLevel = 0;
  }

  let currentBg = $derived(BG_PRESETS[bgIndex].bg);
  let isTransparent = $derived(BG_PRESETS[bgIndex].name === "transparent");
  let isTeardown = $derived(frameTheme.name === "teardown");

  let frameStyle = $derived(
    `--q-surface: ${frameTheme.surface};` +
    `--q-surface-light: ${frameTheme.surfaceLight};` +
    `--q-shadow1: ${frameTheme.shadow1};` +
    `--q-shadow2: ${frameTheme.shadow2};` +
    `--q-shadow3: ${frameTheme.shadow3};` +
    `--q-key: ${frameTheme.keyColor};` +
    `--q-text: ${frameTheme.textColor};` +
    (isTeardown
      ? `background: rgba(255, 255, 255, 0.03);` +
        `backdrop-filter: blur(8px) saturate(1.2);` +
        `-webkit-backdrop-filter: blur(8px) saturate(1.2);` +
        `border: 1px solid rgba(255,255,255,0.15);` +
        `box-shadow: 0 8px 32px rgba(0,0,0,0.4);` +
        `--q-border: rgba(0,0,0,0.12);`
      : isTransparent
        ? `background: rgba(${hexToRgb(frameTheme.frame)}, 0.15);` +
          `backdrop-filter: blur(24px) saturate(1.4);` +
          `-webkit-backdrop-filter: blur(24px) saturate(1.4);` +
          `border: 1px solid rgba(255,255,255,0.12);` +
          `box-shadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08);`
        : `background: ${frameTheme.frame};` +
          `box-shadow: 0px 4px 10px rgba(0,0,0,0.1), inset 0px 2px 4px ${frameTheme.shadow1}, inset 0px -3px 4px ${frameTheme.shadow2}, inset 0px 4px 2px ${frameTheme.shadow3};`)
  );

  /** Convert a hex color like "#1E1E2E" to an "r, g, b" string for use in rgba(). */
  function hexToRgb(hex: string): string {
    if (!hex.startsWith("#")) return "255, 255, 255";
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  // ── Synth state ──
  let mode: "quantum" | "chemistry" | "ecology" = $state("quantum");
  let started = $state(false);
  let octave = $state(4);
  let playing = $state(false);
  let lastNote = $state("");

  let knob1 = $state(0.5);
  let knob2 = $state(0.0);
  let knob3 = $state(0.5);
  let knob4 = $state(0.8);

  let probabilities = $state<number[]>([]);
  let lastMeasured = $state(-1);

  // Viewport scaling
  let scale = $state(1);
  let synthEl: HTMLDivElement;

  function updateScale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scaleX = (vw - 40) / morphSize.w;
    const scaleY = (vh - 40) / morphSize.h;
    scale = Math.min(scaleX, scaleY, 1);
  }

  onMount(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  });

  // Re-scale when morph level changes
  $effect(() => {
    morphSize; // track dependency
    updateScale();
  });

  let circuitParams = $derived<CircuitParams>({
    numQubits: 3,
    rotations: [knob1 * Math.PI * 2, knob2 * Math.PI * 2, knob3 * Math.PI * 2],
    hadamards: [true, true, true],
    cnots: [[0, 1], [1, 2]],
  });

  $effect(() => {
    if (mode === "quantum") probabilities = runCircuit(circuitParams);
  });

  async function start() {
    await ensureAudio();
    started = true;
    probabilities = runCircuit(circuitParams);
  }

  function handleNoteOn(note: string) {
    if (!started) return;
    lastNote = note;
    playNoteOn(note);
  }

  function handleNoteOff(note: string) {
    if (!started) return;
    playNoteOff(note);
  }

  async function handlePlay() {
    if (!started || playing) return;
    playing = true;
    if (mode === "quantum") {
      const length = Math.floor(knob4 * 14) + 2;
      const melody = generateMelody(circuitParams, length, octave);
      await playSequence(
        melody.map((n: { note: string; duration: string }) => ({ note: n.note, duration: n.duration })),
        100 + knob1 * 80,
      );
    } else if (mode === "chemistry") {
      const aminoScale: Record<string, string> = {
        A: "C", R: "D", N: "E", D: "F", C: "G", Q: "A", E: "B",
        G: "C", H: "D", I: "E", L: "F", K: "G", M: "A", F: "B",
      };
      const seq = "ARNDCQEGHILKMF";
      const notes = seq.split("").map((aa) => ({
        note: `${aminoScale[aa] || "C"}${octave}`, duration: "8n" as const,
      }));
      await playSequence(notes, 80 + knob1 * 120);
    }
    playing = false;
  }

  function handleOctaveDown() { if (octave > 1) octave--; }
  function handleOctaveUp() { if (octave < 7) octave++; }
  function handleStop() { stopAll(); playing = false; }

  let knobColors = $derived(
    mode === "quantum" ? ["#5CB6F2", "#02CA71", "#FFFFFF", "#F97133"]
    : mode === "chemistry" ? ["#02CA71", "#5CB6F2", "#FFFFFF", "#F97133"]
    : ["#F97133", "#02CA71", "#FFFFFF", "#5CB6F2"],
  );
  let knobLabels = $derived(
    mode === "quantum" ? ["θ₁", "θ₂", "θ₃", "seq"]
    : mode === "chemistry" ? ["tempo", "scale", "oct", "timbre"]
    : ["low", "mid", "high", "gain"],
  );

  // ── Drag & Drop Sampler ──
  let isDraggingFile = $state(false);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!isDraggingFile) isDraggingFile = true;
  }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    if (e.relatedTarget === null) isDraggingFile = false;
  }
  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDraggingFile = false;
    const file = e.dataTransfer?.files[0];
    // Check if it's an audio file (or fallback for some file extensions)
    if (file && (file.type.startsWith("audio/") || file.name.endsWith(".mp3") || file.name.endsWith(".wav"))) {
      const arrayBuffer = await file.arrayBuffer();
      await loadSample(arrayBuffer);
    }
  }
</script>

<svelte:window ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop} />

<!-- Background layer (non-interactive) -->
<div class="bg-layer" class:bg-transparent={isTransparent} style="background: {currentBg}"></div>

<!-- Floating settings dock -->
<div class="settings-dock">
  <button class="dock-btn" onclick={shuffleThemes} aria-label="Shuffle themes">shuffle</button>
  <div class="dock-divider"></div>
  <button class="dock-btn" onclick={() => (showBgPicker = true)} aria-label="Change background">bg</button>
  <div class="dock-divider"></div>
  <button class="dock-btn" class:dock-active={infoMode !== "off"} onclick={cycleInfoMode} aria-label="Toggle info mode">{INFO_MODE_LABELS[infoMode]}</button>
  <div class="dock-divider"></div>
  <button class="dock-btn" class:dock-active={morphLevel > 0} onclick={cycleMorph} aria-label="Morph interface complexity">morph: {MORPH_LABELS[morphLevel]}</button>
  <div class="dock-divider"></div>
  <button class="dock-btn" class:dock-active={exploded} onclick={toggleExplode} aria-label="Explode view">{exploded ? "collapse" : "explode"}</button>
  <div class="dock-divider"></div>
  <button class="dock-btn" class:dock-active={composing} onclick={toggleCompose} aria-label="Compose new layout">{composing ? "exit compose" : "compose"}</button>
</div>

<!-- Info tooltip -->
<InfoTooltip info={activeInfo} x={tooltipX} y={tooltipY} onclose={() => (activeInfo = null)} />

{#if !started}
  <div class="start-overlay">
    <button class="start-btn" onclick={start}>
      <span class="start-label">Q · SYNTH</span>
      <span class="start-sub">click to start audio</span>
    </button>
  </div>
{/if}

<!-- Drag & Drop Overlay -->
{#if isDraggingFile}
  <div class="drag-overlay">
    <div class="drag-message">
      <span class="drag-icon">⏷</span>
      <h2>DROP AUDIO TO CHOP</h2>
      <p>Will be sliced across 24 keys (F3 - E5)</p>
    </div>
  </div>
{/if}

<!-- Background picker modal -->
{#if showBgPicker}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="picker-backdrop" onclick={() => (showBgPicker = false)} onkeydown={() => {}}></div>
  <div class="bg-picker-panel" role="dialog" aria-label="Background picker">
    <div class="picker-header">
      <span class="picker-title">Background</span>
      <button class="picker-close" onclick={() => (showBgPicker = false)} aria-label="Close">✕</button>
    </div>
    <div class="picker-grid">
      {#each BG_PRESETS as preset, i}
        <button
          class="bg-swatch"
          class:active={bgIndex === i}
          onclick={() => { bgIndex = i; showBgPicker = false; }}
          aria-label="Background: {preset.name}"
        >
          <div
            class="bg-swatch-preview"
            class:checkerboard={preset.name === "transparent"}
            style="background: {preset.bg}"
          ></div>
          <span class="bg-swatch-name">{preset.name}</span>
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- Frame theme picker modal -->
<ThemePicker bind:theme={frameTheme} bind:open={showFramePicker} />

<!-- Scaled wrapper -->
{#if composing}
<div style="--q-surface: {frameTheme.surface}; --q-surface-light: {frameTheme.surfaceLight}; --q-shadow1: {frameTheme.shadow1}; --q-shadow2: {frameTheme.shadow2}; --q-shadow3: {frameTheme.shadow3}; --q-key: {frameTheme.keyColor}; --q-text: {frameTheme.textColor};">
  <Composer
    {mode}
    {probabilities}
    {lastMeasured}
    {octave}
    {lastNote}
    {playing}
    bind:knob1
    bind:knob2
    bind:knob3
    bind:knob4
    {knobColors}
    {knobLabels}
    onnoteon={handleNoteOn}
    onnoteoff={handleNoteOff}
    onplay={handlePlay}
    onstop={handleStop}
    onoctavedown={handleOctaveDown}
    onoctaveup={handleOctaveUp}
  />
</div>
{:else if exploded}
<div class="explode-view" style="--q-surface: {frameTheme.surface}; --q-surface-light: {frameTheme.surfaceLight}; --q-shadow1: {frameTheme.shadow1}; --q-shadow2: {frameTheme.shadow2}; --q-shadow3: {frameTheme.shadow3}; --q-key: {frameTheme.keyColor}; --q-text: {frameTheme.textColor};">
  <div class="explode-card explode-wide">
    <span class="explode-label">speaker</span>
    <div class="explode-content" style="width:160px;height:160px"><Speaker /></div>
  </div>
  <div class="explode-card explode-wide">
    <span class="explode-label">display</span>
    <div class="explode-content" style="width:380px;height:160px">
      <Display {probabilities} activeIndex={lastMeasured} {mode} note={lastNote} {octave} />
    </div>
  </div>
  <div class="explode-card">
    <span class="explode-label">mode switch</span>
    <div class="explode-content" style="width:240px;height:80px"><ModeSwitch bind:mode /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">knob θ₁</span>
    <div class="explode-content" style="width:120px;height:120px"><Knob bind:value={knob1} color={knobColors[0]} label={knobLabels[0]} /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">knob θ₂</span>
    <div class="explode-content" style="width:120px;height:120px"><Knob bind:value={knob2} color={knobColors[1]} label={knobLabels[1]} /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">knob θ₃</span>
    <div class="explode-content" style="width:120px;height:120px"><Knob bind:value={knob3} color={knobColors[2]} label={knobLabels[2]} /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">knob seq</span>
    <div class="explode-content" style="width:120px;height:120px"><Knob bind:value={knob4} color={knobColors[3]} label={knobLabels[3]} /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">shift</span>
    <div class="explode-content" style="width:90px;height:70px"><OpButton label="shift" /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">octave ◀</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label="◀" onclick={handleOctaveDown} /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">octave ▶</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label="▶" onclick={handleOctaveUp} /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">record</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label="●" color="#EF5350" /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">play</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label="▶" onclick={handlePlay} active={playing} /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">stop</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label="■" onclick={handleStop} /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">COM</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label="COM" /></div>
  </div>
  {#each ["1","2","3","4","5","6","7","8"] as n}
  <div class="explode-card">
    <span class="explode-label">btn {n}</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label={n} /></div>
  </div>
  {/each}
  <div class="explode-card">
    <span class="explode-label">IN</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label="IN" /></div>
  </div>
  <div class="explode-card">
    <span class="explode-label">OUT</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label="OUT" /></div>
  </div>
  {#each ["T1","T2","T3","T4"] as t, i}
  <div class="explode-card">
    <span class="explode-label">{t}</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label={t} active={i === 0} /></div>
  </div>
  {/each}
  <div class="explode-card">
    <span class="explode-label">♩ note</span>
    <div class="explode-content" style="width:70px;height:70px"><OpButton label="♩" /></div>
  </div>
  <div class="explode-card explode-full">
    <span class="explode-label">piano + drums</span>
    <div class="explode-content explode-piano" style="width:100%;height:320px">
      <PianoKeys {octave} onnoteon={handleNoteOn} onnoteoff={handleNoteOff} />
    </div>
  </div>
</div>
{:else}
<div class="scale-wrapper" style="transform: scale({scale})">
  <div class="keyboard-body" bind:this={synthEl} style="{frameStyle} width: {morphSize.w}px; height: {morphSize.h}px;">
    {#if isTeardown}
      <div class="teardown-bg">
        <!-- substrate -->
        <div class="td-substrate"></div>
        <!-- wireless charging coil -->
        <div class="td-coil"></div>
        <!-- discrete orange ribbon wiring routing through the chassis -->
        <svg class="td-wiring" viewBox="0 0 800 300" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Ribbon A (Top Edge routing) -->
          <path d="M -10 30 L 150 30 Q 180 30, 180 60 L 180 120 Q 180 150, 210 150 L 520 150 Q 550 150, 550 120 L 550 50 Q 550 20, 580 20 L 810 20" stroke="#FF7B00" stroke-width="1.5" stroke-opacity="0.3" stroke-linecap="round" />
          <path d="M -10 34 L 150 34 Q 176 34, 176 60 L 176 120 Q 176 154, 210 154 L 520 154 Q 554 154, 554 120 L 554 50 Q 554 24, 580 24 L 810 24" stroke="#FF7B00" stroke-width="1.5" stroke-opacity="0.25" stroke-linecap="round" />
          <path d="M -10 38 L 150 38 Q 172 38, 172 60 L 172 120 Q 172 158, 210 158 L 520 158 Q 558 158, 558 120 L 558 50 Q 558 28, 580 28 L 810 28" stroke="#FF7B00" stroke-width="1.5" stroke-opacity="0.2" stroke-linecap="round" />

          <!-- Ribbon B (Left Edge vertical routing) -->
          <path d="M 60 -10 L 60 180 Q 60 210, 90 210 L 110 210 Q 140 210, 140 240 L 140 310" stroke="#FF7B00" stroke-width="1.5" stroke-opacity="0.3" stroke-linecap="round" />
          <path d="M 64 -10 L 64 180 Q 64 206, 90 206 L 110 206 Q 144 206, 144 240 L 144 310" stroke="#FF7B00" stroke-width="1.5" stroke-opacity="0.25" stroke-linecap="round" />
          <path d="M 68 -10 L 68 180 Q 68 202, 90 202 L 110 202 Q 148 202, 148 240 L 148 310" stroke="#FF7B00" stroke-width="1.5" stroke-opacity="0.2" stroke-linecap="round" />

          <!-- Ribbon C (Right Edge vertical routing) -->
          <path d="M 750 -10 L 750 150 Q 750 180, 720 180 L 690 180 Q 660 180, 660 210 L 660 310" stroke="#FF7B00" stroke-width="1.5" stroke-opacity="0.25" stroke-linecap="round" />
          <path d="M 754 -10 L 754 150 Q 754 184, 720 184 L 690 184 Q 656 184, 656 210 L 656 310" stroke="#FF7B00" stroke-width="1.5" stroke-opacity="0.2" stroke-linecap="round" />
          <path d="M 758 -10 L 758 150 Q 758 188, 720 188 L 690 188 Q 652 188, 652 210 L 652 310" stroke="#FF7B00" stroke-width="1.5" stroke-opacity="0.15" stroke-linecap="round" />
        </svg>
        <!-- alignment grid -->
        <div class="td-grid"></div>
        <!-- frost -->
        <div class="td-frost"></div>
      </div>
    {/if}
    <div class="inner-panel" class:morph-1={morphLevel >= 1} class:morph-2={morphLevel >= 2} class:morph-3={morphLevel >= 3} class:morph-4={morphLevel >= 4} class:glass-inner={isTransparent && !isTeardown} class:teardown-inner={isTeardown} style="grid-template-columns: repeat({morphSize.cols}, 1fr); grid-template-rows: repeat({morphSize.rows}, 1fr);">

      <!-- R1-2, C1-2: Speaker -->
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="slot morph-hide-2" style="grid-area: 1/1 / span 2/span 2" onclick={(e) => infoClick("speaker", e)}><Speaker /></div>

      <!-- R1, C3-4: Shift -->
      <div class="slot morph-hide-2" style="grid-area: 1/3 / span 1/span 2"><OpButton label="shift" onclick={(e) => infoClick("shift", e as MouseEvent)} /></div>
      <!-- R2, C3-4: Nav -->
      <div class="slot morph-hide-2" style="grid-area: 2/3 / span 1/span 1"><OpButton label="◀" onclick={(e) => infoClick("octaveDown", e as MouseEvent, handleOctaveDown)} /></div>
      <div class="slot morph-hide-2" style="grid-area: 2/4 / span 1/span 1"><OpButton label="▶" onclick={(e) => infoClick("octaveUp", e as MouseEvent, handleOctaveUp)} /></div>

      <!-- R1-2, C5-8: Display -->
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="slot" style="grid-area: {morphLevel >= 3 ? '1/1 / span 2/span 4' : '1/5 / span 2/span 4'}" onclick={(e) => infoClick("display", e)}>
        <Display {probabilities} activeIndex={lastMeasured} {mode} note={lastNote} {octave} />
      </div>

      <!-- R1-2: Knobs -->
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="slot" style="grid-area: {morphLevel >= 3 ? '1/5 / span 2/span 2' : '1/9 / span 2/span 2'}" onclick={(e) => infoClick(getKnobInfo(0, mode), e)}><Knob bind:value={knob1} color={knobColors[0]} label={knobLabels[0]} /></div>
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="slot" style="grid-area: {morphLevel >= 3 ? '1/7 / span 2/span 2' : '1/11 / span 2/span 2'}" onclick={(e) => infoClick(getKnobInfo(1, mode), e)}><Knob bind:value={knob2} color={knobColors[1]} label={knobLabels[1]} /></div>
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="slot" style="grid-area: {morphLevel >= 3 ? '1/9 / span 2/span 2' : '1/13 / span 2/span 2'}" onclick={(e) => infoClick(getKnobInfo(2, mode), e)}><Knob bind:value={knob3} color={knobColors[2]} label={knobLabels[2]} /></div>
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="slot" style="grid-area: {morphLevel >= 3 ? '1/11 / span 2/span 2' : '1/15 / span 2/span 2'}" onclick={(e) => infoClick(getKnobInfo(3, mode), e)}><Knob bind:value={knob4} color={knobColors[3]} label={knobLabels[3]} /></div>

      <!-- R1-2, C17: COM -->
      <div class="slot morph-hide-2" style="grid-area: 1/17 / span 2/span 1"><OpButton label="COM" onclick={(e) => infoClick("com", e as MouseEvent)} /></div>

      <!-- R3: Mode + buttons full width -->
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="slot morph-hide-4" style="grid-area: {morphLevel >= 3 ? '3/1 / span 2/span 3' : '3/1 / span 1/span 3'}" onclick={(e) => { if (infoMode !== 'off') { const m = (e.target as HTMLElement).closest('button'); if (m) { const idx = Array.from(m.parentElement!.children).indexOf(m); infoClick(['modeQuantum','modeChemistry','modeEcology'][idx] ?? 'modeQuantum', e); } } }}><ModeSwitch bind:mode /></div>
      <div class="slot morph-hide-1" style="grid-area: 3/4 / span 1/span 4">
        <div class="button-row">
          <OpButton label="1" onclick={(e) => infoClick("btn1", e as MouseEvent)} />
          <OpButton label="2" onclick={(e) => infoClick("btn2", e as MouseEvent)} />
          <OpButton label="3" onclick={(e) => infoClick("btn3", e as MouseEvent)} />
          <OpButton label="4" onclick={(e) => infoClick("btn4", e as MouseEvent)} />
        </div>
      </div>
      <div class="slot morph-hide-1" style="grid-area: 3/8 / span 1/span 2">
        <div class="button-row">
          <OpButton label="IN" onclick={(e) => infoClick("btnIn", e as MouseEvent)} />
          <OpButton label="OUT" onclick={(e) => infoClick("btnOut", e as MouseEvent)} />
        </div>
      </div>
      <div class="slot morph-hide-1" style="grid-area: 3/10 / span 1/span 8">
        <div class="button-row">
          <OpButton label="5" onclick={(e) => infoClick("btn5", e as MouseEvent)} />
          <OpButton label="6" onclick={(e) => infoClick("btn6", e as MouseEvent)} />
          <OpButton label="7" onclick={(e) => infoClick("btn7", e as MouseEvent)} />
          <OpButton label="8" onclick={(e) => infoClick("btn8", e as MouseEvent)} />
          <OpButton label="T1" onclick={(e) => infoClick("btnT1", e as MouseEvent)} />
          <OpButton label="T2" onclick={(e) => infoClick("btnT2", e as MouseEvent)} />
          <OpButton label="T3" onclick={(e) => infoClick("btnT3", e as MouseEvent)} />
          <OpButton label="T4" onclick={(e) => infoClick("btnT4", e as MouseEvent)} />
        </div>
      </div>

      <!-- R4, C1-3: Transport -->
      <div class="slot morph-hide-2" style="grid-area: 4/1 / span 1/span 1"><OpButton label="●" color="#EF5350" onclick={(e) => infoClick("record", e as MouseEvent)} /></div>
      <div class="slot morph-hide-2" style="grid-area: 4/2 / span 1/span 1"><OpButton label="▶" onclick={(e) => infoClick("play", e as MouseEvent, handlePlay)} active={playing} /></div>
      <div class="slot morph-hide-2" style="grid-area: 4/3 / span 1/span 1"><OpButton label="■" onclick={(e) => infoClick("stop", e as MouseEvent, handleStop)} /></div>

      <!-- R5-6, C1-3: Bottom controls -->
      <div class="slot morph-hide-1" style="grid-area: 5/1 / span 1/span 1"><OpButton label="←" onclick={(e) => infoClick("octaveDown", e as MouseEvent, handleOctaveDown)} /></div>
      <div class="slot morph-hide-1" style="grid-area: 5/2 / span 1/span 1"><OpButton label="→" onclick={(e) => infoClick("octaveUp", e as MouseEvent, handleOctaveUp)} /></div>
      <div class="slot morph-hide-1" style="grid-area: 5/3 / span 1/span 1"><OpButton label="shift" onclick={(e) => infoClick("shift", e as MouseEvent)} /></div>
      <div class="slot morph-hide-1" style="grid-area: 6/1 / span 1/span 1"><OpButton label="♩" onclick={(e) => infoClick("btnNote", e as MouseEvent)} /></div>
      <div class="slot morph-hide-1" style="grid-area: 6/2 / span 1/span 1"><OpButton label="play" onclick={(e) => infoClick("play", e as MouseEvent, handlePlay)} active={playing} /></div>
      <div class="slot morph-hide-1" style="grid-area: 6/3 / span 1/span 1"><OpButton label="stop" onclick={(e) => infoClick("stop", e as MouseEvent, handleStop)} /></div>

      <!-- R4-6, C4-17: Piano + Drums -->
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="slot piano-slot morph-hide-4" style="grid-area: {morphLevel >= 3 ? '3/4 / span 2/span 9' : (morphLevel >= 2 ? '3/4 / span 2/span 14' : (morphLevel === 1 ? '4/4 / span 2/span 14' : '4/4 / span 3/span 14'))}" onclick={(e) => infoClick("pianoKeys", e)}>
        <PianoKeys {octave} onnoteon={handleNoteOn} onnoteoff={handleNoteOff} />
      </div>
    </div>

    <!-- Brand label — click to open frame theme picker -->
    <button
      class="brand-label"
      onclick={() => (showFramePicker = true)}
      aria-label="Change frame theme"
    >
      <span class="brand-name" style="color: {frameTheme.brandColor}">Q·SYNTH</span>
      <span class="brand-theme" style="color: {frameTheme.textColor}; border-color: {frameTheme.textColor}">{frameTheme.name}</span>
    </button>
  </div>
</div>
{/if}

<style>
  /* ── Background layer ── */
  .bg-layer {
    position: fixed;
    inset: 0;
    z-index: -1;
    transition: background 0.8s ease, opacity 0.8s ease;
  }
  .bg-layer.bg-transparent {
    opacity: 0;
  }

  /* ── Settings dock ── */
  .settings-dock {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 50;
    display: flex;
    align-items: center;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    backdrop-filter: blur(12px);
    overflow: hidden;
  }
  .dock-btn {
    background: none;
    border: none;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    font-family: -apple-system, sans-serif;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .dock-btn:hover {
    color: rgba(255,255,255,0.8);
    background: rgba(255,255,255,0.06);
  }
  .dock-btn.dock-active {
    color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.08);
  }
  .dock-divider {
    width: 1px;
    height: 14px;
    background: rgba(255,255,255,0.1);
    flex-shrink: 0;
  }

  /* ── Start overlay ── */
  .start-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(8px);
  }
  .start-btn {
    background: #2E3337;
    border: 2px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 36px 56px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .start-btn:hover {
    transform: scale(1.03);
    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  }
  .start-label {
    font-size: 28px;
    font-weight: 700;
    color: #5CB6F2;
    letter-spacing: 0.18em;
    font-family: -apple-system, sans-serif;
  }
  .start-sub {
    font-size: 11px;
    color: #777;
    font-family: -apple-system, sans-serif;
    letter-spacing: 0.05em;
  }

  /* ── Picker shared styles ── */
  .picker-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  /* ── Drag & Drop Overlay ── */
  .drag-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none; /* Let events pass through to window */
  }
  .drag-message {
    text-align: center;
    color: #fff;
    border: 3px dashed rgba(255, 123, 0, 0.6);
    border-radius: 20px;
    padding: 60px 100px;
    background: rgba(255, 123, 0, 0.1);
  }
  .drag-icon {
    font-size: 64px;
    color: #FF7B00;
    display: block;
    margin-bottom: 20px;
    animation: bounce 1s infinite alternate;
  }
  .drag-message h2 {
    font-family: 'Courier New', monospace;
    font-size: 32px;
    letter-spacing: 4px;
    margin: 0 0 10px 0;
  }
  .drag-message p {
    font-family: sans-serif;
    font-size: 16px;
    opacity: 0.7;
    margin: 0;
  }
  @keyframes bounce {
    0% { transform: translateY(-10px); }
    100% { transform: translateY(10px); }
  }

  .bg-picker-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 201;
    background: #1a1a22;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    min-width: 360px;
  }
  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .picker-title {
    font-size: 13px;
    font-weight: 600;
    color: #888;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: -apple-system, sans-serif;
  }
  .picker-close {
    appearance: none;
    background: none;
    border: none;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .picker-close:hover { color: #aaa; background: rgba(255,255,255,0.05); }

  .picker-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  .bg-swatch {
    appearance: none;
    background: none;
    border: 2px solid transparent;
    border-radius: 10px;
    padding: 4px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: border-color 0.15s, transform 0.1s;
  }
  .bg-swatch:hover { transform: scale(1.05); }
  .bg-swatch.active { border-color: rgba(255,255,255,0.3); }
  .bg-swatch-preview {
    width: 100%;
    aspect-ratio: 1.6;
    border-radius: 8px;
  }
  .bg-swatch-preview.checkerboard {
    background:
      conic-gradient(#555 0.25turn, #333 0.25turn 0.5turn, #555 0.5turn 0.75turn, #333 0.75turn) top left / 12px 12px repeat !important;
  }
  .bg-swatch-name {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #888;
    font-family: -apple-system, sans-serif;
  }

  /* ── Info mode overlay hint ── */
  :global(body.info-learn) * { cursor: help !important; }
  .scale-wrapper {
    transform-origin: center center;
    transition: transform 0.5s ease;
  }

  /* ── OP-1 Field Body ── */
  .keyboard-body {
    position: relative;
    border-radius: 25px;
    transition: width 0.5s ease, height 0.5s ease, background 0.4s ease, box-shadow 0.4s ease, backdrop-filter 0.4s ease, border 0.4s ease;
  }

  /* ── Black inner panel ── */
  .inner-panel {
    background: #000;
    border: 3px solid var(--q-border, #000);
    border-radius: 10px;
    position: absolute;
    z-index: 1;
    top: 18px;
    left: 18px;
    right: 86px;
    bottom: 18px;
    display: grid;
    overflow: hidden;
    transition: grid-template-columns 0.5s ease, grid-template-rows 0.5s ease, background 0.4s ease, border-color 0.4s ease;
  }
  .inner-panel.glass-inner {
    background: rgba(0, 0, 0, 0.35);
    border-color: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .inner-panel.teardown-inner {
    background: transparent;
    border-color: transparent;
  }
  .teardown-bg {
    position: absolute;
    inset: 0;
    border-radius: 25px;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Clean substrate — light semi-transparent aluminum chassis ── */
  .td-substrate {
    position: absolute;
    inset: 3px;
    border-radius: 22px;
    background: linear-gradient(135deg, rgba(240, 240, 245, 0.4) 0%, rgba(225, 225, 230, 0.25) 100%);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.8),
      inset 0 -1px 2px rgba(0, 0, 0, 0.05);
  }

  /* ── Wireless charging coil — silver/white on light substrate ── */
  .td-coil {
    position: absolute;
    right: 18%;
    top: 50%;
    transform: translateY(-50%);
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background:
      radial-gradient(circle,
        transparent 0%,
        transparent 28%,
        rgba(255, 255, 255, 0.25) 29%,
        transparent 30%,
        transparent 36%,
        rgba(0, 0, 0, 0.02) 37%,
        transparent 38%,
        transparent 44%,
        rgba(255, 255, 255, 0.3) 45%,
        transparent 46%,
        transparent 52%,
        rgba(0, 0, 0, 0.02) 53%,
        transparent 54%,
        transparent 60%,
        rgba(255, 255, 255, 0.25) 61%,
        transparent 62%,
        transparent 68%,
        rgba(0, 0, 0, 0.02) 69%,
        transparent 70%,
        transparent 100%
      );
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
  }

  /* ── Discrete internal wiring ── */
  .td-wiring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1; /* slightly above the substrate */
    filter: drop-shadow(0 2px 4px rgba(255, 123, 0, 0.15));
  }

  /* ── Dot-matrix product label — darker gray for contrast ── */
  .td-dot-label {
    position: absolute;
    bottom: 10%;
    right: 6%;
    font-size: 7px;
    font-weight: 600;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: rgba(0, 0, 0, 0.22);
    font-family: 'Courier New', monospace;
    white-space: nowrap;
  }

  /* ── Faint alignment grid — dark grid on light background ── */
  .td-grid {
    position: absolute;
    inset: 3px;
    border-radius: 22px;
    background:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 39px,
        rgba(0, 0, 0, 0.015) 39px,
        rgba(0, 0, 0, 0.015) 40px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 39px,
        rgba(0, 0, 0, 0.015) 39px,
        rgba(0, 0, 0, 0.015) 40px
      );
  }

  /* ── Frosted glass overlay — very light ── */
  .td-frost {
    position: absolute;
    inset: 0;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(0.5px);
    -webkit-backdrop-filter: blur(0.5px);
  }

  .slot { min-width: 0; min-height: 0; transition: opacity 0.3s ease, transform 0.3s ease; }
  .piano-slot { overflow: hidden; }

  /* ── Morph visibility ── */
  .inner-panel.morph-1 .morph-hide-1,
  .inner-panel.morph-2 .morph-hide-1,
  .inner-panel.morph-3 .morph-hide-1,
  .inner-panel.morph-4 .morph-hide-1,
  .inner-panel.morph-3 .morph-hide-2,
  .inner-panel.morph-4 .morph-hide-2,
  .inner-panel.morph-4 .morph-hide-3,
  .inner-panel.morph-4 .morph-hide-4 {
    display: none;
  }

  .button-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    height: 100%;
  }

  /* ── Brand label (clickable frame theme switcher) ── */
  .brand-label {
    appearance: none;
    background: none;
    border: none;
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 8px 4px;
    border-radius: 8px;
    transition: background 0.15s;
  }
  .brand-label:hover {
    background: rgba(0,0,0,0.04);
  }
  .brand-name {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    font-family: -apple-system, sans-serif;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transition: color 0.3s;
  }
  .brand-theme {
    font-size: 8px;
    font-family: -apple-system, sans-serif;
    border: 1px solid;
    border-radius: 3px;
    padding: 2px 5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: color 0.3s, border-color 0.3s;
  }

  /* ── Explode view ── */
  .explode-view {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 40px 30px 80px;
    justify-content: center;
    align-items: start;
    animation: explode-in 0.5s ease both;
  }
  @keyframes explode-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .explode-card {
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(8px);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .explode-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .explode-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    font-family: -apple-system, sans-serif;
  }
  .explode-content {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .explode-wide {
    flex-basis: auto;
  }
  .explode-full {
    flex-basis: 100%;
    max-width: 1200px;
  }
  .explode-full .explode-content {
    width: 100%;
  }
  .explode-piano {
    min-width: 700px;
  }
</style>
