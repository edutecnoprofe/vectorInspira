let allImages = [];
let filteredImages = [];
let selectedTagsFilter = [];
let currentModalImageId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadGallery();
  setupEventListeners();
});

async function loadGallery() {
  try {
    allImages = await getAllImages();
    filteredImages = allImages;
    await renderTagsFilter();
    renderGallery();
  } catch (error) {
    console.error("Error loading gallery:", error);
  }
}

async function renderTagsFilter() {
  const container = document.getElementById("tags-filter");
  container.innerHTML = "";

  const allTags = await getAllTags();

  allTags.forEach(tag => {
    const label = document.createElement("label");
    label.className = "tag-filter-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = tag;
    checkbox.onchange = (e) => {
      if (e.target.checked) {
        selectedTagsFilter.push(tag);
      } else {
        selectedTagsFilter = selectedTagsFilter.filter(t => t !== tag);
      }
      applyFilter();
    };

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(tag));
    container.appendChild(label);
  });
}

function applyFilter() {
  if (selectedTagsFilter.length === 0) {
    filteredImages = allImages;
  } else {
    filteredImages = allImages.filter(image => {
      return selectedTagsFilter.every(tag => image.tags.includes(tag));
    });
  }

  renderGallery();
  updateStats();
  updateClearButton();
}

function updateClearButton() {
  const btn = document.getElementById("btn-clear-filter");
  if (selectedTagsFilter.length > 0) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
}

document.getElementById("btn-clear-filter").addEventListener("click", () => {
  selectedTagsFilter = [];
  document.querySelectorAll(".tag-filter-checkbox input").forEach(checkbox => {
    checkbox.checked = false;
  });
  applyFilter();
});

function renderGallery() {
  const gallery = document.getElementById("gallery");
  const emptyState = document.getElementById("empty-state");

  if (filteredImages.length === 0) {
    gallery.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  gallery.innerHTML = filteredImages.map(image => `
    <div class="gallery-item" data-id="${image.id}">
      <img src="${getImageUrl(image)}" alt="Imagen" class="gallery-thumbnail" data-id="${image.id}">
      <div class="gallery-tags">
        ${image.tags.map(tag => `<span class="tag-badge-small">${tag}</span>`).join("")}
      </div>
    </div>
  `).join("");

  // Add click listeners
  document.querySelectorAll(".gallery-thumbnail").forEach(img => {
    img.addEventListener("click", (e) => {
      const imageId = parseInt(e.target.dataset.id);
      openImageModal(imageId);
    });
  });
}

function getImageUrl(image) {
  return image.url || "";
}

function updateStats() {
  const count = filteredImages.length;
  const text = count === 1 ? "1 imagen" : `${count} imágenes`;
  document.getElementById("image-count").textContent = text;
}

function openImageModal(imageId) {
  const image = allImages.find(img => img.id === imageId);
  if (!image) return;

  currentModalImageId = imageId;

  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-image");
  const modalTags = document.getElementById("modal-tags");
  const tagsEdit = document.getElementById("modal-tags-edit");

  modalImg.src = getImageUrl(image);
  modalTags.innerHTML = image.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join("");
  tagsEdit.value = image.tags.join(", ");

  modal.style.display = "flex";
}

function closeImageModal() {
  document.getElementById("image-modal").style.display = "none";
  currentModalImageId = null;
}

document.querySelector(".modal-close").addEventListener("click", closeImageModal);

document.getElementById("image-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("image-modal")) {
    closeImageModal();
  }
});

document.getElementById("btn-save-tags").addEventListener("click", async () => {
  const tagsEdit = document.getElementById("modal-tags-edit");
  const messageDiv = document.getElementById("modal-message");

  const newTags = tagsEdit.value
    .split(",")
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  if (newTags.length === 0) {
    messageDiv.textContent = "Debe haber al menos un tag";
    messageDiv.className = "status-message error";
    return;
  }

  try {
    await updateImageTags(currentModalImageId, newTags);

    // Reload gallery
    await loadGallery();
    messageDiv.textContent = "Tags actualizados";
    messageDiv.className = "status-message success";

    setTimeout(() => {
      closeImageModal();
    }, 800);
  } catch (error) {
    console.error("Error updating tags:", error);
    messageDiv.textContent = "Error al actualizar tags";
    messageDiv.className = "status-message error";
  }
});

document.getElementById("btn-delete-image").addEventListener("click", async () => {
  if (!confirm("¿Eliminar esta imagen?")) return;

  const messageDiv = document.getElementById("modal-message");

  try {
    await deleteImage(currentModalImageId);

    // Reload gallery
    await loadGallery();
    messageDiv.textContent = "Imagen eliminada";
    messageDiv.className = "status-message success";

    setTimeout(() => {
      closeImageModal();
    }, 800);
  } catch (error) {
    console.error("Error deleting image:", error);
    messageDiv.textContent = "Error al eliminar imagen";
    messageDiv.className = "status-message error";
  }
});

function setupEventListeners() {
  // Already set up in the code above
}
