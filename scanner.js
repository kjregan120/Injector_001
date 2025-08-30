// scan.js — expose a callable function and still auto-run on inject.
(() => {
  async function runRangeScan() {
    
(() => {
  // === Begin: Original console IIFE core ===
  const runScanOnce = () => {
    const out = { all: [], unique: [], blocked: [] };

    const scanDoc = (doc, frameUrl) => {
      const visit = (el) => {
        if (!(el instanceof Element)) return;

        const isTarget =
          el.tagName?.toLowerCase() === 'range-datepicker-cell' ||
          (el.hasAttribute?.('date-from') && el.hasAttribute?.('date-to'));

        if (isTarget) {
          const sSec = Number(el.getAttribute('date-from'));
          const eSec = Number(el.getAttribute('date-to')); // often exclusive
          const toISO = sec => (sec && !Number.isNaN(sec)) ? new Date(sec*1000).toISOString() : null;
          out.all.push({
            frameUrl,
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            startSec: sSec,
            endSec: eSec,
            startUTC: toISO(sSec),
            endExclusiveUTC: toISO(eSec),
            endInclusiveUTC: eSec ? new Date(eSec*1000 - 1).toISOString() : null,
            days: (sSec && eSec) ? (eSec - sSec)/86400 : null
          });
        }

        if (el.shadowRoot) Array.from(el.shadowRoot.children).forEach(visit);
        Array.from(el.children).forEach(visit);
      };

      visit(doc.documentElement);

      doc.querySelectorAll('iframe').forEach((ifr) => {
        const src = ifr.getAttribute('src') || (ifr.hasAttribute('srcdoc') ? '(srcdoc)' : '(about:blank)');
        const tokens = ifr.sandbox ? [...ifr.sandbox] : [];
        try {
          const cd = ifr.contentDocument;
          const cw = ifr.contentWindow;
          if (!cd || !cw) throw new Error('no content document');
          scanDoc(cd, cw.location.href);
        } catch (e) {
          out.blocked.push({
            frameSrc: src,
            sandbox: ifr.hasAttribute('sandbox'),
            tokens,
            allowsScripts: tokens.includes('allow-scripts'),
            allowsSameOrigin: tokens.includes('allow-same-origin')
          });
        }
      });
    };

    scanDoc(document, location.href);

    // Deduplicate by start/end seconds and count occurrences
    const map = new Map();
    for (const r of out.all) {
      const key = `${r.startSec}|${r.endSec}`;
      if (!map.has(key)) map.set(key, { ...r, count: 0 });
      map.get(key).count++;
    }
    out.unique = [...map.values()].sort((a,b) => b.count - a.count);

    // Pretty print
    if (out.unique.length) {
      const rows = out.unique.map(({startUTC,endExclusiveUTC,endInclusiveUTC,days,count}) =>
        ({ startUTC, endExclusiveUTC, endInclusiveUTC, days, count })
      );
      console.group('[Datepicker] Unique ranges (deduped)');
      console.table(rows);
      console.groupEnd();

      const top = out.unique[0];
      console.log(
        `Most common range: ${top.startUTC} → ${top.endExclusiveUTC} (exclusive)` +
        ` | inclusive end ${top.endInclusiveUTC} | days=${top.days} | seen ${top.count}x`
      );
    } else {
      console.warn('No ranges found in accessible frames.');
    }

    if (out.blocked.length) {
      console.group('Inaccessible frames (cross-origin or sandboxed)');
      console.table(out.blocked);
      console.groupEnd();
    }

    // Stash for reference (isolated world)
    window.__pickerRanges = out;
    return out;
  };
  // === End: Original console IIFE core ===

  // Run immediately
  const first = runScanOnce();

  // If nothing found, retry for a short window as the page hydrates
  if (!first?.all?.length) {
    const START = Date.now();
    const MAX_MS = 6000; // retry for up to ~6s
    let timer = null;

    const debouncedScan = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const res = runScanOnce();
        if (res?.all?.length || Date.now() - START > MAX_MS) {
          // Done: either found something or timed out
          obs.disconnect();
        }
      }, 150);
    };

    const obs = new MutationObserver(debouncedScan);
    obs.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true
    });

    // Also poke a couple of times in case no mutations fire
    setTimeout(debouncedScan, 500);
    setTimeout(debouncedScan, 1500);
    setTimeout(debouncedScan, 3000);
    setTimeout(debouncedScan, 5000);
  }
})();

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
