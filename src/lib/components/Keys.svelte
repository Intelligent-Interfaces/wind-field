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

  const whiteKeyDefs = [
    { note: "F", octOff: -1 }, { note: "G", octOff: -1 },
    { note: "A", octOff: -1 }, { note: "B", octOff: -1 },
    { note: "C", octOff: 0 }, { note: "D", octOff: 0 }, { note: "E", octOff: 0 },
    { note: "F", octOff: 0 }, { note: "G", octOff: 0 },
    { note: "A", octOff: 0 }, { note: "B", octOff: 0 },
    { note: "C", octOff: 1 }, { note: "D", octOff: 1 }, { note: "E", octOff: 1 },
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

  let keyMap = $derived.by(() => {
    const map: Record<string, string> = {
      a: fullNote("F", -1), s: fullNote("G", -1), d: fullNote("A", -1), f: fullNote("B", -1),
      g: fullNote("C", 0), h: fullNote("D", 0), j: fullNote("E", 0),
      k: fullNote("F", 0), l: fullNote("G", 0), ";": fullNote("A", 0), "'": fullNote("B", 0),
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

<div class="keys-row" role="group" aria-label="Piano keys">
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

<style>
  .keys-row {
    display: grid;
    grid-template-columns: repeat(14, minmax(56px, 1fr));
    gap: 3px;
    padding: 3px;
    height: 100%;
    min-height: 100px;
    touch-action: none;
    user-select: none;
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
