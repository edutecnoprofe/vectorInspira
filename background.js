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
    const imageUrl = info.srcUrl;

    // Store for popup
    chrome.storage.session.set({
      pendingImage: {
        url: imageUrl,
        tabId: tab.id
      }
    });

    // Open popup
    chrome.action.openPopup();
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

    captureImage(imageUrl)
      .then(blob => saveImage(blob, tags, imageUrl))
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error("Error saving image:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});

function captureImage(imageUrl) {
  return fetch(imageUrl)
    .then(response => response.blob())
    .catch(() => {
      // Fallback: via canvas (limited by CORS)
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(resolve, "image/jpeg", 0.9);
        };
        img.onerror = reject;
        img.src = imageUrl;
      });
    });
}
