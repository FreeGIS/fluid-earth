<script>
  import ZoomIn from 'carbon-icons-svelte/lib/ZoomIn.svelte';
  import ZoomOut from 'carbon-icons-svelte/lib/ZoomOut.svelte';
  import Tweener from '../tweener.js';
  import { cubicOut } from 'svelte/easing';
  import { clamp } from '../math.js';
  import tooltip from '../tooltip.js';

  export let zoom;
  export let minZoom;
  export let maxZoom;

  let tweener = new Tweener(z => zoom = z, {
    duration: 500,
    easing: cubicOut,
  });

  function smoothZoom(zoomIn) {
    let newZoom = zoomIn ? zoom * 2 : zoom / 2;
    tweener.tween(zoom, clamp(newZoom, minZoom, maxZoom));
  }
</script>

<div class="sidedock">
  <button
    aria-label="Zoom in"
    on:click={() => smoothZoom(true)}
    use:tooltip={{content: 'Zoom in', placement: 'left'}}
  >
    <ZoomIn size={24} />
  </button>
  <button
    aria-label="Zoom out"
    on:click={() => smoothZoom(false)}
    use:tooltip={{content: 'Zoom out', placement: 'left'}}
  >
    <ZoomOut size={24} />
  </button>
</div>

<style>
  div.sidedock {
    background: var(--secondary-color-dark);
    display: flex;
    flex-direction: column;
    margin-left: auto;
    pointer-events: auto;
    padding: 8px 4px 8px 8px;
    border-radius: 24px 0 0 24px;
    filter: drop-shadow(0 0 2px black);
  }

  button {
    all: unset;
    display: flex;
    border-radius: 50%;
    background: var(--secondary-color);
    padding: 8px;
    cursor: pointer;
    transition: filter 0.25s ease 0s;
  }

  button + button {
    margin-top: 8px;
  }

  button:focus, button:hover {
    filter: brightness(125%);
  }

  button:focus:not(:focus-visible):not(:hover) {
    filter: none;
  }
</style>
