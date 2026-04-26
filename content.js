let overlay = null;
let selecting = false;
let startX = 0, startY = 0;
let selectionBox = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startRegionSelect") {
    startRegionSelector();
    sendResponse({ ok: true });
  }
});

function startRegionSelector() {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.id = "__region-selector-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    cursor: crosshair;
    background: rgba(0, 0, 0, 0.25);
  `;

  const hint = document.createElement("div");
  hint.textContent = "Arrastra para seleccionar región — ESC para cancelar";
  hint.style.cssText = `
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.75);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-family: sans-serif;
    font-size: 14px;
    pointer-events: none;
    z-index: 2147483647;
  `;
  overlay.appendChild(hint);

  selectionBox = document.createElement("div");
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px solid #4CAF50;
    background: rgba(76, 175, 80, 0.1);
    display: none;
    pointer-events: none;
    z-index: 2147483647;
  `;
  overlay.appendChild(selectionBox);

  overlay.addEventListener("mousedown", onMouseDown);
  document.addEventListener("keydown", onKeyDown);
  document.body.appendChild(overlay);
}

function onMouseDown(e) {
  e.preventDefault();
  selecting = true;
  startX = e.clientX;
  startY = e.clientY;
  selectionBox.style.left = startX + "px";
  selectionBox.style.top = startY + "px";
  selectionBox.style.width = "0px";
  selectionBox.style.height = "0px";
  selectionBox.style.display = "block";

  overlay.addEventListener("mousemove", onMouseMove);
  overlay.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e) {
  if (!selecting) return;

  const x = Math.min(e.clientX, startX);
  const y = Math.min(e.clientY, startY);
  const w = Math.abs(e.clientX - startX);
  const h = Math.abs(e.clientY - startY);

  selectionBox.style.left = x + "px";
  selectionBox.style.top = y + "px";
  selectionBox.style.width = w + "px";
  selectionBox.style.height = h + "px";
}

function onMouseUp(e) {
  if (!selecting) return;
  selecting = false;

  const x = Math.min(e.clientX, startX);
  const y = Math.min(e.clientY, startY);
  const w = Math.abs(e.clientX - startX);
  const h = Math.abs(e.clientY - startY);

  cleanup();

  if (w < 5 || h < 5) return; // demasiado pequeño, ignorar

  chrome.runtime.sendMessage({
    action: "regionSelected",
    coords: {
      x, y, width: w, height: h,
      devicePixelRatio: window.devicePixelRatio || 1
    }
  });
}

function onKeyDown(e) {
  if (e.key === "Escape") {
    cleanup();
    chrome.runtime.sendMessage({ action: "regionCancelled" });
  }
}

function cleanup() {
  if (overlay) {
    overlay.removeEventListener("mousedown", onMouseDown);
    overlay.removeEventListener("mousemove", onMouseMove);
    overlay.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
    overlay = null;
  }
  selecting = false;
}
