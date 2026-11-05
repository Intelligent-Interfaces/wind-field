<script lang="ts">
  let {
    label = "",
    color = "",
    active = false,
    onclick,
    children,
  }: {
    label?: string;
    color?: string;
    active?: boolean;
    onclick?: (e?: MouseEvent) => void;
    children?: import("svelte").Snippet;
  } = $props();

  let pressed = $state(false);
</script>

<button
  class="op-btn"
  class:pressed
  class:active
  aria-label={label}
  onmousedown={() => (pressed = true)}
  onmouseup={() => (pressed = false)}
  onmouseleave={() => (pressed = false)}
  onclick={(e) => onclick?.(e)}
>
  <div class="btn-inner" style={color ? `background: ${color}` : ''}>
    {#if children}
      {@render children()}
    {:else if label}
      <span class="btn-label">{label}</span>
    {/if}
  </div>
</button>

<style>
  .op-btn {
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
    box-sizing: border-box;
    border-radius: 40px;
    height: 100%;
    width: 100%;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--q-surface-light, #DCDFE7);
    box-shadow:
      3px 3px 6px var(--q-shadow2, #A6ABBD),
      -3px -3px 6px var(--q-shadow3, #F4F4F4),
      inset 0px 1px 4px rgba(0,0,0,0.05),
      inset 2px 2px 3px rgba(255,255,255,0.15);
  }
  .op-btn.pressed .btn-inner,
  .op-btn.active .btn-inner {
    box-shadow:
      rgba(0,0,0,0) 3px 3px 6px,
      var(--q-shadow3, #F4F4F4) -3px -3px 6px,
      var(--q-shadow2, #A6ABBD) 2px 3px 6px inset,
      rgba(255,255,255,0.08) 2px 2px 3px inset;
  }
  .btn-label {
    font-size: 8px;
    font-weight: 600;
    color: var(--q-text, #333);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: -apple-system, sans-serif;
    white-space: nowrap;
  }
  .btn-inner :global(svg) {
    height: 32px;
    width: 32px;
    fill: var(--q-text, #2E3337);
  }
</style>
