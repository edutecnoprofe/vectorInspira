// Import db functions
importScripts("utils/db.js");

// Setup on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-image",
    title: "Guardar imagen con tags",
    contexts: ["image"]
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
      pendingImage: {
        url: info.srcUrl,
        tabId: tab.id
      }
    });

    const popupUrl = chrome.runtime.getURL("popup/popup.html");
    chrome.windows.create({
      url: popupUrl,
      type: "popup",
      width: 420,
      height: 380,
      focused: true
    });
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

    // Save URL directly — no fetch/CORS issues, <img src> works fine in gallery
    saveImage(imageUrl, tags)
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error("Error saving image:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});
