<script lang="ts">
  let {
    mode = $bindable("quantum"),
  }: {
    mode: "quantum" | "chemistry" | "ecology";
  } = $props();

  const modes: { id: "quantum" | "chemistry" | "ecology"; color: string; label: string }[] = [
    { id: "quantum", color: "#5CB6F2", label: "⚛" },
    { id: "chemistry", color: "#02CA71", label: "⬡" },
    { id: "ecology", color: "#F97133", label: "◉" },
  ];
</script>

<div class="mode-grid" role="radiogroup" aria-label="Instrument mode">
  {#each modes as m}
    <button
      class="mode-btn"
      class:active={mode === m.id}
      role="radio"
      aria-checked={mode === m.id}
      onclick={() => (mode = m.id)}
    >
      <div class="btn-inner" style={mode === m.id ? `color: ${m.color}` : ''}>
        <span class="mode-icon">{m.label}</span>
      </div>
    </button>
  {/each}
</div>

<style>
  .mode-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    height: 100%;
  }
  .mode-btn {
    appearance: none;
    background: var(--q-surface, #D9DCE5);
    border: 3px solid var(--q-border, #000);
    border-radius: 6px;
    outline: none;
    height: 100%;
    width: 100%;
    padding: 8px;
    cursor: pointer;
  }
  .btn-inner {
    border-radius: 40px;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--q-surface-light, #DCDFE7);
    box-shadow:
      3px 3px 6px var(--q-shadow2, #A6ABBD),
      -3px -3px 6px var(--q-shadow3, #F4F4F4),
      inset 0px 1px 4px rgba(0,0,0,0.05),
      inset 2px 2px 3px rgba(255,255,255,0.15);
    transition: all 0.15s ease;
  }
  .mode-btn.active .btn-inner {
    box-shadow:
      rgba(0,0,0,0) 3px 3px 6px,
      var(--q-shadow3, #F4F4F4) -3px -3px 6px,
      var(--q-shadow2, #A6ABBD) 2px 3px 6px inset,
      rgba(255,255,255,0.08) 2px 2px 3px inset;
  }
  .mode-icon {
    font-size: 18px;
    color: var(--q-text, #555);
  }
  .mode-btn.active .mode-icon { color: inherit; }
</style>
