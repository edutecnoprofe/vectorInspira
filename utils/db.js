const DB_NAME = "ImageTagsDB";
const STORE_NAME = "images";

let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

function saveImage(url, tags) {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const image = {
        url,
        tags: Array.isArray(tags) ? tags : [tags],
        savedDate: Date.now()
      };

      const request = store.add(image);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  });
}

function getAllImages() {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  });
}

function getImagesByTags(tagsArray) {
  return getAllImages().then(images => {
    if (!tagsArray || tagsArray.length === 0) return images;

    return images.filter(image => {
      return tagsArray.every(tag => image.tags.includes(tag));
    });
  });
}

function getAllTags() {
  return getAllImages().then(images => {
    const tagsSet = new Set();
    images.forEach(image => {
      image.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  });
}

function updateImageTags(id, newTags) {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const image = getRequest.result;
        if (!image) {
          reject(new Error("Image not found"));
          return;
        }

        image.tags = Array.isArray(newTags) ? newTags : [newTags];
        const updateRequest = store.put(image);

        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve(id);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  });
}

function deleteImage(id) {
  return initDB().then(database => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  });
}
