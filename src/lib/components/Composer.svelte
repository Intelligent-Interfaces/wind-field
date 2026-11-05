<script lang="ts">
  import Knob from "$lib/components/Knob.svelte";
  import Display from "$lib/components/Display.svelte";
  import ModeSwitch from "$lib/components/ModeSwitch.svelte";
  import PianoKeys from "$lib/components/PianoKeys.svelte";
  import DrumPads from "$lib/components/DrumPads.svelte";
  import Keys from "$lib/components/Keys.svelte";
  import Speaker from "$lib/components/Speaker.svelte";
  import OpButton from "$lib/components/OpButton.svelte";

  let {
    mode = "quantum",
    probabilities = [],
    lastMeasured = -1,
    octave = 4,
    lastNote = "",
    playing = false,
    knob1 = $bindable(0.5),
    knob2 = $bindable(0),
    knob3 = $bindable(0.5),
    knob4 = $bindable(0.8),
    knobColors = ["#5CB6F2", "#02CA71", "#FFFFFF", "#F97133"],
    knobLabels = ["θ₁", "θ₂", "θ₃", "seq"],
    onnoteon,
    onnoteoff,
    onplay,
    onstop,
    onoctavedown,
    onoctaveup,
    onmodechange,
  }: {
    mode?: "quantum" | "chemistry" | "ecology";
    probabilities?: number[];
    lastMeasured?: number;
    octave?: number;
    lastNote?: string;
    playing?: boolean;
    knob1?: number;
    knob2?: number;
    knob3?: number;
    knob4?: number;
    knobColors?: string[];
    knobLabels?: string[];
    onnoteon?: (note: string) => void;
    onnoteoff?: (note: string) => void;
    onplay?: () => void;
    onstop?: () => void;
    onoctavedown?: () => void;
    onoctaveup?: () => void;
    onmodechange?: (m: "quantum" | "chemistry" | "ecology") => void;
  } = $props();

  // ── Part definitions ──
  type PartDef = {
    id: string;
    label: string;
    minW: number; // min grid cols
    minH: number; // min grid rows
    defaultW: number;
    defaultH: number;
  };

  const PART_DEFS: PartDef[] = [
    { id: "speaker", label: "Speaker", minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
    { id: "display", label: "Display", minW: 3, minH: 2, defaultW: 4, defaultH: 2 },
    { id: "modeSwitch", label: "Mode Switch", minW: 2, minH: 1, defaultW: 3, defaultH: 1 },
    { id: "knob1", label: "Knob θ₁", minW: 1, minH: 1, defaultW: 2, defaultH: 2 },
    { id: "knob2", label: "Knob θ₂", minW: 1, minH: 1, defaultW: 2, defaultH: 2 },
    { id: "knob3", label: "Knob θ₃", minW: 1, minH: 1, defaultW: 2, defaultH: 2 },
    { id: "knob4", label: "Knob Seq", minW: 1, minH: 1, defaultW: 2, defaultH: 2 },
    { id: "record", label: "Record ●", minW: 1, minH: 1, defaultW: 1, defaultH: 1 },
    { id: "play", label: "Play ▶", minW: 1, minH: 1, defaultW: 1, defaultH: 1 },
    { id: "stop", label: "Stop ■", minW: 1, minH: 1, defaultW: 1, defaultH: 1 },
    { id: "octDown", label: "Octave ◀", minW: 1, minH: 1, defaultW: 1, defaultH: 1 },
    { id: "octUp", label: "Octave ▶", minW: 1, minH: 1, defaultW: 1, defaultH: 1 },
    { id: "piano", label: "Piano + Drums", minW: 4, minH: 2, defaultW: 8, defaultH: 3 },
    { id: "drums", label: "Drum Pads", minW: 4, minH: 1, defaultW: 8, defaultH: 1 },
    { id: "keys", label: "Piano Keys", minW: 4, minH: 1, defaultW: 8, defaultH: 2 },
    { id: "shift", label: "Shift", minW: 1, minH: 1, defaultW: 1, defaultH: 1 },
    { id: "com", label: "COM", minW: 1, minH: 1, defaultW: 1, defaultH: 1 },
  ];

  const GRID_COLS = 12;
  const GRID_ROWS = 8;

  type Placed = { id: string; col: number; row: number; w: number; h: number };

  let placed = $state<Placed[]>([]);
  let dragPart = $state<string | null>(null);
  let dragW = $state(1);
  let dragH = $state(1);
  let hoverCol = $state(-1);
  let hoverRow = $state(-1);
  let movingIdx = $state(-1); // index in placed[] when repositioning

  // Which parts are already on the canvas
  let placedIds = $derived(new Set(placed.map(p => p.id)));

  function canPlace(col: number, row: number, w: number, h: number, ignoreIdx = -1): boolean {
    if (col < 0 || row < 0 || col + w > GRID_COLS || row + h > GRID_ROWS) return false;
    for (let i = 0; i < placed.length; i++) {
      if (i === ignoreIdx) continue;
      const p = placed[i];
      if (col < p.col + p.w && col + w > p.col && row < p.row + p.h && row + h > p.row) return false;
    }
    return true;
  }

  function handleTrayDragStart(partId: string) {
    const def = PART_DEFS.find(d => d.id === partId)!;
    dragPart = partId;
    dragW = def.defaultW;
    dragH = def.defaultH;
    movingIdx = -1;
  }

  function handlePlacedDragStart(idx: number) {
    const p = placed[idx];
    dragPart = p.id;
    dragW = p.w;
    dragH = p.h;
    movingIdx = idx;
  }

  function handleCellEnter(col: number, row: number) {
    hoverCol = col;
    hoverRow = row;
  }

  function handleDrop() {
    if (!dragPart || hoverCol < 0) return;
    if (canPlace(hoverCol, hoverRow, dragW, dragH, movingIdx)) {
      if (movingIdx >= 0) {
        placed[movingIdx] = { ...placed[movingIdx], col: hoverCol, row: hoverRow };
        placed = [...placed];
      } else {
        placed = [...placed, { id: dragPart, col: hoverCol, row: hoverRow, w: dragW, h: dragH }];
      }
    }
    dragPart = null;
    hoverCol = -1;
    hoverRow = -1;
    movingIdx = -1;
  }

  function handleDragEnd() {
    dragPart = null;
    hoverCol = -1;
    hoverRow = -1;
    movingIdx = -1;
  }

  function removePart(idx: number) {
    placed = placed.filter((_, i) => i !== idx);
  }

  function clearAll() {
    placed = [];
  }

  let showValid = $derived(
    dragPart !== null && hoverCol >= 0 && canPlace(hoverCol, hoverRow, dragW, dragH, movingIdx)
  );
  let showInvalid = $derived(
    dragPart !== null && hoverCol >= 0 && !canPlace(hoverCol, hoverRow, dragW, dragH, movingIdx)
  );

  // Local mode binding for ModeSwitch
  let localMode: "quantum" | "chemistry" | "ecology" = $state("quantum");
  $effect(() => { localMode = mode; });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="composer">
  <!-- Parts tray -->
  <div class="tray">
    <div class="tray-header">
      <span class="tray-title">parts</span>
      <button class="tray-clear" onclick={clearAll}>clear</button>
    </div>
    <div class="tray-list">
      {#each PART_DEFS as def}
        {@const used = placedIds.has(def.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="tray-item"
          class:used
          draggable={!used}
          ondragstart={() => { if (!used) handleTrayDragStart(def.id); }}
          ondragend={handleDragEnd}
        >
          <span class="tray-item-label">{def.label}</span>
          <span class="tray-item-size">{def.defaultW}×{def.defaultH}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Canvas -->
  <div class="canvas-wrap">
    <div
      class="canvas"
      style="grid-template-columns: repeat({GRID_COLS}, 1fr); grid-template-rows: repeat({GRID_ROWS}, 1fr);"
      ondragover={(e) => e.preventDefault()}
      ondrop={handleDrop}
    >
      <!-- Grid cells for hover detection -->
      {#each Array(GRID_ROWS) as _, r}
        {#each Array(GRID_COLS) as _, c}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="grid-cell"
            class:hover-valid={showValid && c >= hoverCol && c < hoverCol + dragW && r >= hoverRow && r < hoverRow + dragH}
            class:hover-invalid={showInvalid && c >= hoverCol && c < hoverCol + dragW && r >= hoverRow && r < hoverRow + dragH}
            style="grid-area: {r+1}/{c+1}"
            ondragenter={() => handleCellEnter(c, r)}
          ></div>
        {/each}
      {/each}

      <!-- Placed components -->
      {#each placed as p, idx}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="placed-part"
          style="grid-area: {p.row+1}/{p.col+1} / span {p.h}/span {p.w};"
          draggable={true}
          ondragstart={() => handlePlacedDragStart(idx)}
          ondragend={handleDragEnd}
        >
          <button class="remove-btn" onclick={() => removePart(idx)} aria-label="Remove {p.id}">✕</button>
          <div class="part-render">
            {#if p.id === "speaker"}
              <Speaker />
            {:else if p.id === "display"}
              <Display {probabilities} activeIndex={lastMeasured} mode={localMode} note={lastNote} {octave} />
            {:else if p.id === "modeSwitch"}
              <ModeSwitch bind:mode={localMode} />
            {:else if p.id === "knob1"}
              <Knob bind:value={knob1} color={knobColors[0]} label={knobLabels[0]} />
            {:else if p.id === "knob2"}
              <Knob bind:value={knob2} color={knobColors[1]} label={knobLabels[1]} />
            {:else if p.id === "knob3"}
              <Knob bind:value={knob3} color={knobColors[2]} label={knobLabels[2]} />
            {:else if p.id === "knob4"}
              <Knob bind:value={knob4} color={knobColors[3]} label={knobLabels[3]} />
            {:else if p.id === "record"}
              <OpButton label="●" color="#EF5350" />
            {:else if p.id === "play"}
              <OpButton label="▶" onclick={onplay} active={playing} />
            {:else if p.id === "stop"}
              <OpButton label="■" onclick={onstop} />
            {:else if p.id === "octDown"}
              <OpButton label="◀" onclick={onoctavedown} />
            {:else if p.id === "octUp"}
              <OpButton label="▶" onclick={onoctaveup} />
            {:else if p.id === "piano"}
              <PianoKeys {octave} onnoteon={onnoteon} onnoteoff={onnoteoff} />
            {:else if p.id === "drums"}
              <DrumPads {octave} onnoteon={onnoteon} onnoteoff={onnoteoff} />
            {:else if p.id === "keys"}
              <Keys {octave} onnoteon={onnoteon} onnoteoff={onnoteoff} />
            {:else if p.id === "shift"}
              <OpButton label="shift" />
            {:else if p.id === "com"}
              <OpButton label="COM" />
            {/if}
          </div>
          <span class="placed-label">{PART_DEFS.find(d => d.id === p.id)?.label}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .composer {
    display: flex;
    gap: 16px;
    padding: 20px;
    height: calc(100vh - 80px);
    animation: fade-in 0.4s ease both;
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ── Tray ── */
  .tray {
    width: 180px;
    flex-shrink: 0;
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 12px;
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .tray-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .tray-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    font-family: -apple-system, sans-serif;
  }
  .tray-clear {
    appearance: none;
    background: none;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 4px;
    color: rgba(255,255,255,0.3);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 6px;
    cursor: pointer;
    font-family: -apple-system, sans-serif;
  }
  .tray-clear:hover { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2); }

  .tray-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tray-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    cursor: grab;
    transition: background 0.15s, opacity 0.15s;
    user-select: none;
  }
  .tray-item:hover:not(.used) {
    background: rgba(255,255,255,0.08);
  }
  .tray-item.used {
    opacity: 0.25;
    cursor: default;
  }
  .tray-item-label {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    font-family: -apple-system, sans-serif;
  }
  .tray-item-size {
    font-size: 9px;
    color: rgba(255,255,255,0.25);
    font-family: -apple-system, sans-serif;
  }

  /* ── Canvas ── */
  .canvas-wrap {
    flex: 1;
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 12px;
    backdrop-filter: blur(8px);
    overflow: hidden;
  }
  .canvas {
    display: grid;
    width: 100%;
    height: 100%;
    gap: 2px;
    position: relative;
  }
  .grid-cell {
    border: 1px dashed rgba(255,255,255,0.06);
    border-radius: 4px;
    transition: background 0.1s;
  }
  .grid-cell.hover-valid {
    background: rgba(92, 182, 242, 0.15);
    border-color: rgba(92, 182, 242, 0.3);
  }
  .grid-cell.hover-invalid {
    background: rgba(239, 83, 80, 0.12);
    border-color: rgba(239, 83, 80, 0.25);
  }

  /* ── Placed parts ── */
  .placed-part {
    position: relative;
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    cursor: grab;
    z-index: 2;
    transition: box-shadow 0.2s;
  }
  .placed-part:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  .part-render {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .placed-label {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    text-align: center;
    padding: 2px 0 4px;
    font-family: -apple-system, sans-serif;
  }
  .remove-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    z-index: 3;
    appearance: none;
    background: rgba(0,0,0,0.6);
    border: none;
    color: rgba(255,255,255,0.3);
    font-size: 10px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s, color 0.15s;
  }
  .placed-part:hover .remove-btn { opacity: 1; }
  .remove-btn:hover { color: #EF5350; }
</style>
