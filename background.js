// Import db functions
importScripts("utils/db.js");

// Setup on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-image",
    title: "Guardar imagen con tags",
    contexts: ["image"]
  });
  chrome.contextMenus.create({
    id: "save-region",
    title: "Guardar región con tags",
    contexts: ["page", "image", "link"]
  });
});

// Extension icon click - open gallery in new tab
chrome.action.onClicked.addListener(() => {
  const galleryUrl = chrome.runtime.getURL("gallery/gallery.html");
  chrome.tabs.create({ url: galleryUrl });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-image") {
    chrome.storage.session.set({
      pendingImage: { url: info.srcUrl, tabId: tab.id }
    });

    const popupUrl = chrome.runtime.getURL("popup/popup.html");
    chrome.windows.create({ url: popupUrl, type: "popup", width: 420, height: 380, focused: true });
  }

  if (info.menuItemId === "save-region") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    }).then(() => {
      chrome.tabs.sendMessage(tab.id, { action: "startRegionSelect" });
    }).catch(err => console.error("executeScript failed:", err));
  }
});

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAllTags") {
    getAllTags()
      .then(tags => sendResponse({ tags }))
      .catch(error => sendResponse({ tags: [], error: error.message }));
    return true;
  }

  if (request.action === "saveImage") {
    const { imageUrl, tags } = request;
    saveImage(imageUrl, tags)
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error("Error saving image:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === "regionSelected") {
    const tabId = sender.tab.id;
    const coords = request.coords;

    // Capture visible tab screenshot then crop
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" })
      .then(dataUrl => cropScreenshot(dataUrl, coords))
      .then(croppedDataUrl => {
        chrome.storage.session.set({
          pendingImage: { url: croppedDataUrl, tabId }
        });
        const popupUrl = chrome.runtime.getURL("popup/popup.html");
        chrome.windows.create({ url: popupUrl, type: "popup", width: 420, height: 380, focused: true });
      })
      .catch(error => console.error("Error capturing region:", error));
  }
});

async function cropScreenshot(dataUrl, { x, y, width, height, devicePixelRatio }) {
  const ratio = devicePixelRatio || 1;

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(Math.round(width * ratio), Math.round(height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageBitmap, -Math.round(x * ratio), -Math.round(y * ratio));

  const croppedBlob = await canvas.convertToBlob({ type: "image/png" });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(croppedBlob);
  });
}
