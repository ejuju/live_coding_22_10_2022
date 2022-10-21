<script lang="ts">
  import P5 from "p5-svelte";
  import { onMount } from "svelte";
  import sketch_0 from "./lib/sketch_0";

  let reloads: number = 0;
  onMount(() => {
    window.addEventListener("resize", () => {
      reloads++;
    });
  });
</script>

<main>
  {#key reloads}
    <P5 sketch={sketch_0} />
  {/key}
</main>

<style>
  main {
    height: 100%;
    width: 100%;
  }
</style>
