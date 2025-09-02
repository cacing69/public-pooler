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
    zIndex: 999999999
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
      zIndex: 1000000000
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

      chrome.runtime.sendMessage({ action: "saveCapture", data: cropped });
      copyImageToClipboard(cropped);
    };
    img.src = imgData;
  }

  function copyImageToClipboard(dataUrl) {
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item])
          .then(() => console.log("✅ Image copied to clipboard"))
          .catch(err => console.error(err));
      });
  }
}
