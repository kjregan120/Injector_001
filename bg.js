
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  // Inject into ALL frames so the code runs inside whichever frame has the picker,
  // mirroring how you'd switch frames in the Console.
  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ["scan.js"]
  });
});
