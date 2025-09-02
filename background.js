chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "grabPooler",
    title: "Grab Pooler to Clipboard",
    contexts: ["all"],
  });

  // Paste URL from extension state
  chrome.contextMenus.create({
    id: "setUrlPooler",
    title: "Set URL Pooler",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "getPoolerPrompt",
    title: "Get Pooler Prompt",
    contexts: ["page", "editable"],
  });

  const DEFAULT_INSTRUCTION = ``;

  chrome.storage.local.set({
    lastPrompt: DEFAULT_INSTRUCTION,
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "grabPooler") {
    grabPoolerAction(tab);
  }

  if (info.menuItemId === "setUrlPooler") {
    const url = tab?.url || "";
    if (url) {
      setUrlPoolerAction(tab);
    }
  }

  if (info.menuItemId === "getPoolerPrompt") {
    getPoolerPromptAction();
  }
});

function showSelectionOverlay(dataUrl) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.3)",
    cursor: "crosshair",
    zIndex: 999999999,
  });
  document.body.appendChild(overlay);

  let startX, startY, rectBox;
  overlay.onmousedown = (e) => {
    startX = e.clientX;
    startY = e.clientY;

    rectBox = document.createElement("div");
    Object.assign(rectBox.style, {
      position: "fixed",
      border: "2px dashed red",
      left: `${startX}px`,
      top: `${startY}px`,
      zIndex: 1000000000,
    });
    overlay.appendChild(rectBox);

    overlay.onmousemove = (ev) => {
      const w = ev.clientX - startX;
      const h = ev.clientY - startY;
      rectBox.style.width = `${Math.abs(w)}px`;
      rectBox.style.height = `${Math.abs(h)}px`;
      rectBox.style.left = `${w < 0 ? ev.clientX : startX}px`;
      rectBox.style.top = `${h < 0 ? ev.clientY : startY}px`;
    };
  };

  overlay.onmouseup = (e) => {
    const x = Math.min(startX, e.clientX);
    const y = Math.min(startY, e.clientY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);

    overlay.remove();

    cropImage(dataUrl, { x, y, w, h });
  };

  function cropImage(imgData, rect) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = rect.w;
      canvas.height = rect.h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
      const cropped = canvas.toDataURL("image/png");

      // save to storage
      chrome.runtime.sendMessage({ action: "saveCapture", data: cropped });

      // copy to clipboard
      copyImageToClipboard(cropped);
    };
    img.src = imgData;
  }

  function copyImageToClipboard(dataUrl) {
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        // pastikan tipe blob image/png
        const imageBlob = new Blob([blob], { type: 'image/png' });

        const item = new ClipboardItem({ "image/png": imageBlob });
        navigator.clipboard.write([item])
          .then(() => console.log("✅ Image copied to clipboard"))
          .catch(err => console.error("Clipboard write failed:", err));
      });
}

}

function grabPoolerAction(tab) {
  chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showSelectionOverlay,
      args: [dataUrl],
    });
  });

  const url = tab?.url || "";
  if (url) {
    chrome.storage.local.set({ lastUrl: { url } });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (u) => {
        navigator.clipboard
          .writeText(u)
          .then(() => console.log("✅ URL copied to clipboard:", u))
          .catch((err) => console.error("Clipboard error:", err));
      },
      args: [url],
    });
  }
}

function setUrlPoolerAction(tab) {
  const url = tab?.url || "";
  if (!url) return;

  chrome.storage.local.set({ lastUrl: { url } }, () => {
    console.log("URL saved", url);
  });
}

function getPoolerPromptAction() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        chrome.storage.local.get(["lastUrl", "lastPrompt"], (data) => {
          if (!data.lastUrl) return alert("⚠️ No URL saved yet!");
          const generatedPrompt = data.lastPrompt.replace(
            "<STATE_URL>",
            data.lastUrl.url
          );
          navigator.clipboard
            .writeText(generatedPrompt)
            .then(() => console.log("✅ Prompt copied to clipboard"))
            .catch((err) => console.error("Clipboard error:", err));
        });
      },
    });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "saveCapture") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      chrome.storage.local.set({ lastCapture: { image: msg.data, url: url } });
    });
  }

  if (msg.action === "runGrabPooler") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        grabPoolerAction(tab);
      }
    });
  }

  if (msg.action === "runSetUrlPooler") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        setUrlPoolerAction(tab);
      }
    });
  }

  if (msg.action === "runGetPoolerPrompt") {
    getPoolerPromptAction();
  }
});
