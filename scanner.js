// scan.js — expose a callable function and still auto-run on inject.
(() => {
  async function runRangeScan() {
    // ─────────────────────────────────────────────────────────────
    // PASTE your existing scan logic here.
    // It should:
    //  - crawl DOM & shadow DOM for range elements
    //  - parse attributes / compute ranges
    //  - handle accessible iframes
    //  - console.table results, etc.
    //
    // If your original file was an IIFE, take its contents and put them here.
    // ─────────────────────────────────────────────────────────────
  }

  // Export for the listener:
  try {
    window.__runRangeScan = runRangeScan;
  } catch (_) {
    // ignore if window isn't writable for some reason
  }

  // When this script is injected (first button press), we also run once immediately.
  runRangeScan();
})();
