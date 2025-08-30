// listener.js — runs automatically on disneyworld.disney.go.com
// Listens for press/activation of <wdpr-button id="findPricesButton">,
// then runs the scanner.

(() => {
  // Find the wdpr-button in an event's composed path (works through shadow DOM)
  function inComposedPathIsViewRates(e) {
    if (!e || typeof e.composedPath !== "function") return false;
    const path = e.composedPath();
    return path.some(
      n =>
        n &&
        n.nodeType === Node.ELEMENT_NODE &&
        n.tagName === "WDPR-BUTTON" &&
        n.id === "findPricesButton"
    );
  }

  // Run scanner if already present; otherwise inject scan.js and let it run.
  function runScan() {
    try {
      if (typeof window.__runRangeScan === "function") {
        window.__runRangeScan();
        return;
      }
    } catch (_) {
      // fall through to injection
    }

    // Inject scan.js into the *page* context so it can see app globals if needed
    const url = chrome.runtime.getURL("scan.js");
    const s = document.createElement("script");
    s.src = url;
    s.async = false;
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
  }

  // Mouse/touch activation
  const onClick = (e) => {
    if (inComposedPathIsViewRates(e)) runScan();
  };

  // Keyboard activation for accessibility (Enter/Space)
  const onKey = (e) => {
    const key = e.key || e.code;
    if ((key === "Enter" || key === " ") && inComposedPathIsViewRates(e)) {
      // Prevent double-activation if the component also handles it
      // (comment out if you prefer not to interfere)
      // e.stopPropagation();
      runScan();
    }
  };

  // Capture phase helps when custom elements stop propagation
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);

  // Optional: run once if the button is programmatically activated
  // by dispatching a 'click' from app code. If their code dispatches
  // CustomEvents we’ll still see them via capture phase above.
})();
