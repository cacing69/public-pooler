const FAB_SIZE = 40;
const FAB_MARGIN = 10;
const fabs = [];

// helper function buat toast
function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: "8px",
        zIndex: 1000000001,
        fontSize: "14px",
        opacity: 0,
        transition: "opacity 0.3s",
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.opacity = 1);
    setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.remove(), 300);
    }, 1500);
}

// helper function buat FAB
function createFab(text, bgColor, onClick) {
    const fab = document.createElement("div");
    fab.textContent = text;
    Object.assign(fab.style, {
        position: "fixed",
        width: `${FAB_SIZE}px`,
        height: `${FAB_SIZE}px`,
        backgroundColor: bgColor,
        color: "#fff",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        zIndex: 999999999,
        userSelect: "none",
    });
    document.body.appendChild(fab);
    fab.addEventListener("click", onClick);
    fabs.push(fab);
    return fab;
}

// fungsi untuk set posisi semua FAB
function setFabsPosition(baseLeft, baseTop) {
    fabs.forEach((fab, index) => {
        fab.style.left = `${baseLeft}px`;
        fab.style.top = `${baseTop + index * (FAB_SIZE + FAB_MARGIN) - ((fabs.length - 1) * (FAB_SIZE + FAB_MARGIN)) / 2}px`;
    });
}

// FAB utama merah
createFab("👀", "#FFC107", () => {
    chrome.runtime.sendMessage({ action: "runGrabPooler" });
    showToast(`Grabbed Pooler`);
});

// FAB biru
createFab("🌐", "#2196f3", () => {
    chrome.runtime.sendMessage({ action: "runSetUrlPooler" });
    showToast(`URL Saved`);
});

// FAB hijau
createFab("💬", "#4caf50", () => {
    chrome.runtime.sendMessage({ action: "runGetPoolerPrompt" });
    showToast(`Prompt Ready`);
});

// posisi awal
let baseLeft = window.innerWidth * 0.25;
let baseTop = window.innerHeight / 2;
setFabsPosition(baseLeft, baseTop);

// drag handle di atas semua FAB
const dragHandle = document.createElement("div");
dragHandle.textContent = "≡";
Object.assign(dragHandle.style, {
    position: "fixed",
    width: "40px",
    height: "20px",
    backgroundColor: "#666",
    color: "#fff",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "grab",
    zIndex: 1000000000,
    left: `${baseLeft}px`,
    top: `${baseTop - (FAB_SIZE + FAB_MARGIN) * fabs.length / 2 - 30}px`,
    transform: "translateX(-50%)",
    userSelect: "none"
});
document.body.appendChild(dragHandle);

// draggable logic
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

dragHandle.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - dragHandle.getBoundingClientRect().left;
    offsetY = e.clientY - dragHandle.getBoundingClientRect().top;
    dragHandle.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    baseLeft = e.clientX - offsetX + dragHandle.offsetWidth / 2;
    baseTop = e.clientY - offsetY + (FAB_SIZE + FAB_MARGIN) * fabs.length / 2 + 30;

    dragHandle.style.left = `${baseLeft}px`;
    dragHandle.style.top = `${baseTop - (FAB_SIZE + FAB_MARGIN) * fabs.length / 2 - 30}px`;

    setFabsPosition(baseLeft, baseTop);
});

document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    dragHandle.style.cursor = "grab";
});
