<script lang="ts">
  /**
   * OP-1 style speaker grille — elliptical dot grid.
   */
</script>

<div class="speaker-housing">
  <svg viewBox="0 0 175 173" fill="none" xmlns="http://www.w3.org/2000/svg">
    {#each Array(13) as _, row}
      {#each Array(10) as _, col}
        {@const cx = 28 + col * 13}
        {@const cy = 20 + row * 10.5}
        {@const distFromCenter = Math.abs(col - 4.5) / 5}
        {@const maxRows = Math.round(13 - distFromCenter * 6)}
        {@const startRow = Math.floor((13 - maxRows) / 2)}
        {#if row >= startRow && row < startRow + maxRows}
          <circle {cx} {cy} r="2.89" fill="black" />
        {/if}
      {/each}
    {/each}
  </svg>
</div>

<style>
  .speaker-housing {
    background: var(--q-surface, #D9DCE5);
    border: 3px solid var(--q-border, #000);
    border-radius: 6px;
    outline: none;
    height: 100%;
    width: 100%;
  }
  svg { height: 100%; width: 100%; }
</style>
