<script lang="ts">
  /**
   * Theme picker panel — centered modal dialog.
   * Controls both background gradient AND OP-1 frame color.
   */
  import { THEMES, type Theme } from "$lib/themes";

  let {
    theme = $bindable(THEMES[0]),
    open = $bindable(false),
  }: {
    theme: Theme;
    open: boolean;
  } = $props();

  function select(t: Theme) {
    theme = t;
    open = false;
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="picker-backdrop" onclick={() => (open = false)} onkeydown={() => {}}></div>
  <div class="picker-panel" role="dialog" aria-label="Theme picker">
    <div class="picker-header">
      <span class="picker-title">Theme</span>
      <button class="picker-close" onclick={() => (open = false)} aria-label="Close">✕</button>
    </div>
    <div class="picker-grid">
      {#each THEMES as t}
        <button
          class="swatch"
          class:active={theme.name === t.name}
          onclick={() => select(t)}
          aria-label="Theme: {t.name}"
        >
          <div class="swatch-bg" style="background: {t.bg}"></div>
          <div class="swatch-frame" style="background: {t.frame}">
            <div class="swatch-inner"></div>
          </div>
          <span class="swatch-name" style="color: {t.brandColor}">{t.name}</span>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .picker-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
  }
  .picker-panel {
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
  .swatch {
    appearance: none;
    background: none;
    border: 2px solid transparent;
    border-radius: 10px;
    padding: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: border-color 0.15s, transform 0.1s;
  }
  .swatch:hover { transform: scale(1.05); }
  .swatch.active { border-color: rgba(255,255,255,0.3); }

  .swatch-bg {
    width: 100%;
    aspect-ratio: 1.6;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
  }
  .swatch-frame {
    position: absolute;
    inset: 0;
    /* Layered on top of bg — but we want both visible */
  }
  /* Actually let's show bg with a mini OP-1 frame inside */
  .swatch-bg {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
  }
  .swatch-frame {
    position: relative;
    width: 85%;
    height: 60%;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .swatch-inner {
    width: 80%;
    height: 70%;
    background: #000;
    border-radius: 2px;
  }
  .swatch-name {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-family: -apple-system, sans-serif;
  }
</style>
