<script lang="ts">
  import type { BanResult } from '$lib/api/ban';

  let { onSelect }: { onSelect: (result: BanResult) => void } = $props();

  let query = $state('');
  let results: BanResult[] = $state([]);
  let isOpen = $state(false);
  let loading = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput() {
    clearTimeout(debounceTimer);
    if (query.length < 3) {
      results = [];
      isOpen = false;
      return;
    }
    loading = true;
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          results = await res.json();
          isOpen = results.length > 0;
        }
      } finally {
        loading = false;
      }
    }, 300);
  }

  function select(result: BanResult) {
    query = result.label;
    isOpen = false;
    onSelect(result);
  }
</script>

<div class="relative">
  <input
    type="text"
    bind:value={query}
    oninput={handleInput}
    placeholder="Ex: 15 rue Cler, 75007 Paris"
    class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage"
    autocomplete="off"
  />
  {#if loading}
    <div class="absolute right-3 top-3.5 text-navy/40 text-sm">...</div>
  {/if}

  {#if isOpen}
    <ul class="absolute z-50 w-full bg-white border border-navy/20 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
      {#each results as result}
        <li>
          <button
            type="button"
            class="w-full text-left px-4 py-3 hover:bg-sage/10 transition text-sm"
            onclick={() => select(result)}
          >
            {result.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
