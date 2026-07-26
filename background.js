const MENU_ID = "codeflingex:insert";
const URL_PATTERNS = ["https://codefling.com/*"];
const INSTANCE = "file_desc";

function pickAndInject(instance) {
    const OVERLAY_ID = "codeflingex-overlay";

    const existing = document.getElementById(OVERLAY_ID);
    if (existing) {
        existing.remove();
    }

    const ck = window.CKEDITOR;
    if (!ck || !ck.instances || !ck.instances[instance]) {
        window.alert("CodeflingEx: description editor not found. Open the file edit page first.");
        return;
    }

    function notify(text, ok) {
        const toast = document.createElement("div");
        toast.textContent = text;
        toast.style.cssText = [
            "position:fixed", "z-index:2147483647", "left:50%", "top:24px", "transform:translateX(-50%)",
            `background:${ok ? "#14532d" : "#4c1d24"}`, `color:${ok ? "#dcfce7" : "#ffd7d7"}`,
            `border:1px solid ${ok ? "#22c55e" : "#ef4444"}`, "border-radius:6px", "padding:12px 18px",
            "font:600 14px/1.4 system-ui,sans-serif", "box-shadow:0 6px 24px rgba(0,0,0,.45)"
        ].join(";");

        document.body.appendChild(toast);
        setTimeout(function removeToast() {
            toast.remove();
        }, 4000);
    }

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = [
        "position:fixed", "z-index:2147483646", "inset:0", "background:rgba(0,0,0,.65)",
        "display:flex", "align-items:center", "justify-content:center"
    ].join(";");

    const box = document.createElement("div");
    box.style.cssText = [
        "background:#131a22", "border:1px solid #1f2a35", "border-radius:10px", "padding:28px 32px",
        "text-align:center", "font:14px/1.5 system-ui,sans-serif", "color:#cfd8e3",
        "box-shadow:0 20px 60px rgba(0,0,0,.6)"
    ].join(";");

    const title = document.createElement("div");
    title.textContent = "Insert description HTML";
    title.style.cssText = "font-size:18px;font-weight:700;color:#fff;margin-bottom:6px";

    const hint = document.createElement("div");
    hint.textContent = "Choose a file or drop it here. Esc to cancel.";
    hint.style.cssText = "color:#7d8da0;font-size:13px;margin-bottom:18px";

    const button = document.createElement("button");
    button.textContent = "Choose HTML file";
    button.style.cssText = [
        "background:#1f6feb", "color:#fff", "border:0", "border-radius:6px", "padding:11px 22px",
        "font:600 14px system-ui,sans-serif", "cursor:pointer"
    ].join(";");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html,.htm,.txt";
    input.style.display = "none";

    box.append(title, hint, button, input);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function close() {
        overlay.remove();
        document.removeEventListener("keydown", onKeyDown);
    }

    function onKeyDown(event) {
        if (event.key === "Escape") {
            close();
        }
    }

    async function apply(file) {
        if (!file) {
            return;
        }

        const html = await file.text();
        if (html.includes("CKEDITOR.instances")) {
            close();
            notify("CodeflingEx: that file is a wrapped console command, not plain HTML.", false);
            return;
        }

        const editor = ck.instances[instance];
        editor.filter.disabled = true;
        editor.setData(html);

        close();
        notify(`CodeflingEx: inserted ${file.name}. Press Save without clicking into the editor.`, true);
    }

    button.addEventListener("click", function onButtonClick() {
        input.click();
    });

    input.addEventListener("change", function onFileChosen() {
        apply(input.files[0]);
    });

    overlay.addEventListener("click", function onOverlayClick(event) {
        if (event.target === overlay) {
            close();
        }
    });

    overlay.addEventListener("dragover", function onDragOver(event) {
        event.preventDefault();
        box.style.borderColor = "#1f6feb";
    });

    overlay.addEventListener("dragleave", function onDragLeave() {
        box.style.borderColor = "#1f2a35";
    });

    overlay.addEventListener("drop", function onDrop(event) {
        event.preventDefault();
        apply(event.dataTransfer.files[0]);
    });

    document.addEventListener("keydown", onKeyDown);

    try {
        input.click();
    } catch (error) {
        button.focus();
    }
}

function createMenu() {
    chrome.contextMenus.removeAll(function onCleared() {
        chrome.contextMenus.create({
            id: MENU_ID,
            title: "CodeflingEx: insert description...",
            contexts: ["all"],
            documentUrlPatterns: URL_PATTERNS
        });
    });
}

chrome.runtime.onInstalled.addListener(createMenu);
chrome.runtime.onStartup.addListener(createMenu);

chrome.contextMenus.onClicked.addListener(function onMenuClicked(info, tab) {
    if (!tab || info.menuItemId !== MENU_ID) {
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: "MAIN",
        func: pickAndInject,
        args: [INSTANCE]
    });
});
