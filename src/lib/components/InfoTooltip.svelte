<script lang="ts">
  import type { ControlInfo } from "$lib/info";

  let {
    info,
    x = 0,
    y = 0,
    onclose,
  }: {
    info: ControlInfo | null;
    x?: number;
    y?: number;
    onclose?: () => void;
  } = $props();

  // Keep tooltip inside viewport
  let panel: HTMLDivElement;
  let tx = $state(x);
  let ty = $state(y);

  $effect(() => {
    if (!panel || !info) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = panel.getBoundingClientRect();
    tx = Math.min(x + 12, vw - rect.width - 12);
    ty = Math.min(y + 12, vh - rect.height - 12);
  });
</script>

{#if info}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="tooltip-backdrop" onclick={onclose} onkeydown={() => {}}></div>
  <div
    class="tooltip"
    bind:this={panel}
    style="left: {tx}px; top: {ty}px"
    role="tooltip"
  >
    <div class="tooltip-header">
      <span class="tooltip-title">{info.title}</span>
      <button class="tooltip-close" onclick={onclose} aria-label="Close">✕</button>
    </div>
    <p class="tooltip-body">{info.body}</p>
  </div>
{/if}

<style>
  .tooltip-backdrop {
    position: fixed;
    inset: 0;
    z-index: 299;
  }
  .tooltip {
    position: fixed;
    z-index: 300;
    background: #111116;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 14px 16px;
    max-width: 280px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.7);
    pointer-events: all;
  }
  .tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
  }
  .tooltip-title {
    font-size: 11px;
    font-weight: 700;
    color: #ddd;
    letter-spacing: 0.04em;
    font-family: -apple-system, sans-serif;
    line-height: 1.3;
  }
  .tooltip-close {
    appearance: none;
    background: none;
    border: none;
    color: #555;
    font-size: 11px;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    line-height: 1;
  }
  .tooltip-close:hover { color: #999; }
  .tooltip-body {
    font-size: 11px;
    color: #888;
    font-family: -apple-system, sans-serif;
    line-height: 1.55;
    margin: 0;
  }
</style>
