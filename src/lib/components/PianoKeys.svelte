<script lang="ts">
  /**
   * OP-1 Field style keyboard area (rows 4-6, cols 4-17).
   * Row 4: Drum pads — round black circles on light button housings
   * Row 5-6: White piano keys — tall rounded pill shapes, tight spacing
   */
  let {
    octave = 4,
    onnoteon,
    onnoteoff,
  }: {
    octave?: number;
    onnoteon?: (note: string) => void;
    onnoteoff?: (note: string) => void;
  } = $props();

  const whiteKeyDefs = [
    { note: "F", octOff: -1 }, { note: "G", octOff: -1 },
    { note: "A", octOff: -1 }, { note: "B", octOff: -1 },
    { note: "C", octOff: 0 }, { note: "D", octOff: 0 }, { note: "E", octOff: 0 },
    { note: "F", octOff: 0 }, { note: "G", octOff: 0 },
    { note: "A", octOff: 0 }, { note: "B", octOff: 0 },
    { note: "C", octOff: 1 }, { note: "D", octOff: 1 }, { note: "E", octOff: 1 },
  ];

  const drumPadDefs: ({ note: string; octOff: number } | null)[] = [
    { note: "F#", octOff: -1 }, { note: "G#", octOff: -1 },
    { note: "A#", octOff: -1 }, null,
    { note: "C#", octOff: 0 }, { note: "D#", octOff: 0 }, null,
    { note: "F#", octOff: 0 }, { note: "G#", octOff: 0 },
    { note: "A#", octOff: 0 }, null,
    { note: "C#", octOff: 1 }, { note: "D#", octOff: 1 }, null,
  ];

  let activeNotes = $state(new Set<string>());

  function noteOn(note: string) {
    activeNotes.add(note);
    activeNotes = new Set(activeNotes);
    onnoteon?.(note);
  }

  function noteOff(note: string) {
    activeNotes.delete(note);
    activeNotes = new Set(activeNotes);
    onnoteoff?.(note);
  }

  function fullNote(note: string, octOff: number): string {
    return `${note}${octave + octOff}`;
  }

  let keyMap = $derived.by(() => {
    const map: Record<string, string> = {
      a: fullNote("F", -1), s: fullNote("G", -1), d: fullNote("A", -1), f: fullNote("B", -1),
      g: fullNote("C", 0), h: fullNote("D", 0), j: fullNote("E", 0),
      k: fullNote("F", 0), l: fullNote("G", 0), ";": fullNote("A", 0), "'": fullNote("B", 0),
      w: fullNote("F#", -1), e: fullNote("G#", -1), r: fullNote("A#", -1),
      t: fullNote("C#", 0), y: fullNote("D#", 0),
      u: fullNote("F#", 0), i: fullNote("G#", 0), o: fullNote("A#", 0),
      p: fullNote("C#", 1), "[": fullNote("D#", 1),
    };
    return map;
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    const n = keyMap[e.key.toLowerCase()];
    if (n) noteOn(n);
  }
  function handleKeyUp(e: KeyboardEvent) {
    const n = keyMap[e.key.toLowerCase()];
    if (n) noteOff(n);
  }
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<div class="keys-area" role="group" aria-label="Piano keyboard">
  <!-- Drum pads row -->
  <div class="drum-row">
    {#each drumPadDefs as pad}
      {#if pad}
        {@const fn = fullNote(pad.note, pad.octOff)}
        <button
          class="drum-cell"
          class:active={activeNotes.has(fn)}
          aria-label={fn}
          onpointerdown={() => noteOn(fn)}
          onpointerup={() => noteOff(fn)}
          onpointerleave={() => { if (activeNotes.has(fn)) noteOff(fn); }}
        >
          <div class="drum-dot" class:active={activeNotes.has(fn)}></div>
        </button>
      {:else}
        <div class="drum-cell empty">
          <div class="drum-dot muted"></div>
        </div>
      {/if}
    {/each}
  </div>

  <!-- White keys row -->
  <div class="white-row">
    {#each whiteKeyDefs as wk}
      {@const fn = fullNote(wk.note, wk.octOff)}
      <button
        class="white-key"
        class:active={activeNotes.has(fn)}
        aria-label={fn}
        onpointerdown={() => noteOn(fn)}
        onpointerup={() => noteOff(fn)}
        onpointerleave={() => { if (activeNotes.has(fn)) noteOff(fn); }}
      ></button>
    {/each}
  </div>
</div>

<style>
  .keys-area {
    display: grid;
    grid-template-rows: 1fr 2.2fr;
    height: 100%;
    min-height: 220px;
    touch-action: none;
    user-select: none;
  }

  /* ── Drum pads ── */
  .drum-row {
    display: grid;
    grid-template-columns: repeat(14, minmax(56px, 1fr));
  }
  .drum-cell {
    appearance: none;
    background: var(--q-surface, #D9DCE5);
    border: 2px solid var(--q-border, #000);
    border-radius: 6px;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 56px;
  }
  .drum-cell.empty { cursor: default; }
  .drum-cell.active { filter: brightness(0.92); }

  .drum-dot {
    width: 55%;
    aspect-ratio: 1;
    max-width: 36px;
    border-radius: 50%;
    background: #1a1a1a;
    box-shadow: inset 0 2px 3px rgba(0,0,0,0.5);
    transition: background 0.05s, transform 0.05s;
  }
  .drum-dot.muted { opacity: 0.25; }
  .drum-dot.active {
    background: #555;
    transform: scale(0.88);
  }

  /* ── White keys ── */
  .white-row {
    display: grid;
    grid-template-columns: repeat(14, minmax(56px, 1fr));
    gap: 3px;
    padding: 3px;
  }
  .white-key {
    appearance: none;
    background: var(--q-key, #ECEEF3);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    padding: 0;
    height: 100%;
    min-height: 100px;
    box-shadow:
      0 2px 4px rgba(0,0,0,0.10),
      inset 0 1px 0 rgba(255,255,255,0.15),
      inset 0 -2px 4px rgba(0,0,0,0.03);
    transition: background 0.05s, box-shadow 0.05s, transform 0.05s;
  }
  .white-key:hover { filter: brightness(0.96); }
  .white-key:active, .white-key.active {
    filter: brightness(0.88);
    transform: translateY(1px);
    box-shadow:
      0 1px 1px rgba(0,0,0,0.06),
      inset 0 2px 5px rgba(0,0,0,0.10);
  }
</style>
