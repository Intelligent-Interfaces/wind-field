<script lang="ts">
  let {
    octave = 4,
    onnoteon,
    onnoteoff,
  }: {
    octave?: number;
    onnoteon?: (note: string) => void;
    onnoteoff?: (note: string) => void;
  } = $props();

  const drumPadDefs: ({ note: string; octOff: number } | null)[] = [
    { note: "F#", octOff: -1 }, { note: "G#", octOff: -1 },
    { note: "A#", octOff: -1 }, null,
    { note: "C#", octOff: 0 }, { note: "D#", octOff: 0 }, null,
    { note: "F#", octOff: 0 }, { note: "G#", octOff: 0 },
    { note: "A#", octOff: 0 }, null,
    { note: "C#", octOff: 1 }, { note: "D#", octOff: 1 }, null,
  ];

  let activeNotes = $state(new Set<string>());

  function fullNote(note: string, octOff: number): string {
    return `${note}${octave + octOff}`;
  }

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
</script>

<div class="drum-area" role="group" aria-label="Drum pads">
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

<style>
  .drum-area {
    display: grid;
    grid-template-columns: repeat(14, minmax(56px, 1fr));
    height: 100%;
    touch-action: none;
    user-select: none;
  }
  .drum-cell {
    appearance: none;
    background: var(--q-surface, #D9DCE5);
    border: 2px solid #000;
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
</style>
