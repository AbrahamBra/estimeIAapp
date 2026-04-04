<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-ivory font-body text-dark-navy">
  <nav class="border-b border-navy/10 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="/" class="font-display text-xl font-bold text-navy">EstimeIA</a>
      <span class="text-sm text-navy/50">Demonstrateur</span>
    </div>
  </nav>

  <main>
    {@render children()}
  </main>

  <footer class="border-t border-navy/10 py-8 text-center text-sm text-navy/40">
    <p>EstimeIA &mdash; Expertise immobiliere augmentee</p>
  </footer>
</div>
