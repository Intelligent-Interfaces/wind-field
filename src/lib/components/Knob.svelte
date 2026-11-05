<script lang="ts">
  let {
    value = $bindable(0.5),
    min = 0,
    max = 1,
    step = 0.01,
    label = "",
    color = "#7CB342",
  }: {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    color?: string;
  } = $props();

  let dragging = $state(false);
  let startY = 0;
  let startValue = 0;

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    startY = e.clientY;
    startValue = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const delta = (startY - e.clientY) * step * 2;
    value = Math.min(max, Math.max(min, startValue + delta));
  }
  function onPointerUp() { dragging = false; }

  let rotation = $derived(((value - min) / (max - min)) * 300 - 150);
</script>

<div
  class="knob-housing"
  role="slider"
  aria-label={label}
  aria-valuenow={value}
  aria-valuemin={min}
  aria-valuemax={max}
  tabindex="0"
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
>
  <div class="knob-ring">
    <div class="knob-cap" style="background: {color}">
      <div class="knob-indent" style="transform: rotate({rotation}deg)">
        <div class="knob-notch"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .knob-housing {
    background: var(--q-surface, #D9DCE5);
    border: 3px solid var(--q-border, #000);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 6px;
    outline: none;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }
  .knob-housing:active { cursor: grabbing; }
  .knob-ring {
    width: 80%;
    aspect-ratio: 1;
    max-width: 108px;
    max-height: 108px;
    border-radius: 50%;
    border: 5px solid #74788D;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .knob-cap {
    width: 58%;
    aspect-ratio: 1;
    border-radius: 50%;
    box-shadow:
      6px 6px 5px var(--q-shadow2, #A6ABBD),
      inset 0px 1px 8px rgba(0,0,0,0.05),
      inset 2px 2px 2px rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .knob-indent {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .knob-notch {
    width: 8px;
    height: 55%;
    border-radius: 50px;
    border: 0.5px solid rgba(0,0,0,0.2);
    box-shadow:
      inset 0px 4px 4px rgba(0,0,0,0.25),
      inset 1px 1px 0.5px rgba(0,0,0,0.1);
  }
</style>
