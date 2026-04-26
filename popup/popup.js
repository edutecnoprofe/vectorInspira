let selectedTags = [];
let allTags = [];
let pendingImageUrl = null;

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Get pending image URL from storage
    const result = await chrome.storage.session.get("pendingImage");
    if (result?.pendingImage) {
      pendingImageUrl = result.pendingImage.url;
    } else {
      document.getElementById("status-message").textContent = "No se detectó imagen. Click derecho en una imagen web.";
      document.getElementById("status-message").className = "status-message error";
      document.getElementById("btn-save").disabled = true;
    }

    // Load all tags from DB
    await loadAllTags();
    renderTagsContainer();
  } catch (error) {
    console.error("Error initializing popup:", error);
    document.getElementById("status-message").textContent = "Error al inicializar";
    document.getElementById("status-message").className = "status-message error";
  }
});

async function loadAllTags() {
  try {
    allTags = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "getAllTags" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response?.tags || []);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error loading tags:", error);
    allTags = [];
  }
}

function renderTagsContainer() {
  const container = document.getElementById("tags-container");
  container.innerHTML = "";

  allTags.forEach(tag => {
    const label = document.createElement("label");
    label.className = "tag-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = tag;
    checkbox.onchange = (e) => {
      if (e.target.checked) {
        selectedTags.push(tag);
      } else {
        selectedTags = selectedTags.filter(t => t !== tag);
      }
      updateSelectedTagsDisplay();
    };

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(tag));
    container.appendChild(label);
  });
}

function updateSelectedTagsDisplay() {
  const display = document.getElementById("selected-tags");
  display.innerHTML = selectedTags.map(tag =>
    `<span class="tag-badge">${tag} <button type="button" class="remove-tag" data-tag="${tag}">×</button></span>`
  ).join("");

  document.querySelectorAll(".remove-tag").forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag;
      selectedTags = selectedTags.filter(t => t !== tag);
      updateSelectedTagsDisplay();
    });
  });
}

document.getElementById("new-tag-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const input = e.target;
    const tag = input.value.trim();

    if (tag && !selectedTags.includes(tag)) {
      selectedTags.push(tag);
      updateSelectedTagsDisplay();
      input.value = "";
    }
  }
});

document.getElementById("btn-save").addEventListener("click", async () => {
  const statusDiv = document.getElementById("status-message");

  if (!pendingImageUrl) {
    statusDiv.textContent = "Error: No image URL found";
    statusDiv.className = "status-message error";
    return;
  }

  if (selectedTags.length === 0) {
    statusDiv.textContent = "Selecciona al menos un tag";
    statusDiv.className = "status-message error";
    return;
  }

  // Disable button and show loading
  const saveBtn = document.getElementById("btn-save");
  saveBtn.disabled = true;
  statusDiv.textContent = "Guardando...";
  statusDiv.className = "status-message loading";

  try {
    // Send message to background to save image
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "saveImage",
          imageUrl: pendingImageUrl,
          tags: selectedTags
        },
        resolve
      );
    });

    if (response?.success) {
      statusDiv.textContent = "¡Imagen guardada!";
      statusDiv.className = "status-message success";

      // Close popup after 1 second
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      statusDiv.textContent = response?.error || "Error al guardar";
      statusDiv.className = "status-message error";
      saveBtn.disabled = false;
    }
  } catch (error) {
    console.error("Error:", error);
    statusDiv.textContent = "Error: " + error.message;
    statusDiv.className = "status-message error";
    saveBtn.disabled = false;
  }
});

document.getElementById("btn-cancel").addEventListener("click", () => {
  window.close();
});
