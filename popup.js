const urlInput = document.getElementById("urlInput");
const promptStub = document.getElementById("promptStub");
const preview = document.getElementById("preview");
const updateBtn = document.getElementById("updateStub");

// load state
chrome.storage.local.get(["stub", "lastCapture"], (res) => {
  if (res.stub) promptStub.value = res.stub;
  if (res.lastCapture?.url) urlInput.value = res.lastCapture.url;
  if (res.lastCapture?.image) {
    preview.innerHTML = `<img src="${res.lastCapture.image}" width="200"/>`;
  }
});

// auto-save stub while typing
promptStub.addEventListener("input", () => {
  chrome.storage.local.set({ stub: promptStub.value });
});

updateBtn.addEventListener("click", () => {
  chrome.storage.local.set({ stub: promptStub.value });
});

// auto-update urlInput ke storage
urlInput.addEventListener("input", () => {
  chrome.storage.local.set({ lastCapture: { url: urlInput.value } });
});
