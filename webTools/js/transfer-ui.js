// js/transfer-ui.js
// Load local libs (falls back to CDN if local fails)
function loadScript(src) {
    return new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) return res();
        const s = document.createElement("script");
        s.src = src;
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
    });
}

async function ensureLibs() {
    // NOTE: we use "qrcode-generator" (global `qrcode`) instead of qrcodejs (global `QRCode`).
    // qrcodejs ignores the typeNumber option and its auto version picker reads the wrong
    // column of its capacity table for level H, which caused "code length overflow".
    const localQR = "./js/lib/qrcode-generator.min.js";
    const localJSQR = "./js/lib/jsQR.js";

    if (typeof qrcode === "undefined") {
        await loadScript(localQR).catch(() =>
            loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"));
    }
    if (typeof jsQR === "undefined") {
        await loadScript(localJSQR).catch(() => loadScript("https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"));
    }
    // Encode as UTF-8 if the lib supports it
    if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs["UTF-8"]) {
        qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    }
}

import { chunkPayload, TransferReceiver } from "./app.js";

export async function openSendDialog(payload, title = "Send via QR") {
    await ensureLibs();

    const CAPACITY_H = [
        0, 7, 14, 24, 34, 44, 58, 64, 84, 98, 119,
        137, 155, 177, 194, 220, 250, 280, 310, 338, 360,
        382, 403, 439, 461, 482, 509, 565, 611, 661, 715,
        751, 805, 868, 908, 982, 1030, 1112, 1168, 1228, 1283
    ];

    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:#000;display:flex;flex-direction:column;z-index:9999";
    overlay.innerHTML = `
      <div id="qrBox" style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px">
        <canvas id="qrCanvas" style="height:100%;max-width:100%;aspect-ratio:1;image-rendering:pixelated"></canvas>
      </div>
      <div style="display:flex;gap:16px;align-items:center;padding:10px 16px;background:var(--panel);border-top:1px solid var(--border);flex-wrap:wrap">
        <label class="small muted" style="flex:2;min-width:200px">
          Width: <b id="wLbl"></b> px · <span id="nLbl"></span> frames
          <input id="qrVersion" type="range" min="1" max="40" step="1" value="15" style="width:100%"/>
        </label>
        <label class="small muted" style="flex:1;min-width:120px">Frame interval (ms)
          <input id="interval" type="number" value="350" min="120" max="2000" style="width:100%"/>
        </label>
        <button class="danger" id="closeBtn">Close</button>
      </div>`;
    document.body.appendChild(overlay);

    const canvas = overlay.querySelector("#qrCanvas");
    const versionInput = overlay.querySelector("#qrVersion");
    const wLbl = overlay.querySelector("#wLbl");
    const nLbl = overlay.querySelector("#nLbl");

    const FRAME_OVERHEAD = 45, SAFETY_MARGIN = 10, QUIET = 2, CELL = 10;
    let frames = [], idx = 0, timer = null, version = 15, running = true;

    function regenerate() {
        version = parseInt(versionInput.value) || 15;
        wLbl.textContent = 17 + 4 * version;               // snaps to valid QR widths: 21, 25, ... 177
        const maxChunk = Math.max(20, CAPACITY_H[version] - FRAME_OVERHEAD - SAFETY_MARGIN);
        frames = chunkPayload(payload, maxChunk);
        nLbl.textContent = frames.length;
        idx = 0;
        if (timer) clearTimeout(timer);
        draw();
    }

    function renderFrame(text) {
        const qr = qrcode(version, "H");
        qr.addData(text, "Byte");
        qr.make();
        const n = qr.getModuleCount(), total = n + QUIET * 2, size = total * CELL;
        canvas.width = canvas.height = size;               // CSS scales it to fill the modal
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#fff";
        for (let r = 0; r < n; r++)
            for (let c = 0; c < n; c++)
                if (qr.isDark(r, c)) ctx.fillRect((c + QUIET) * CELL, (r + QUIET) * CELL, CELL, CELL);
    }

    function draw() {
        timer = null;
        if (!running || !frames.length) return;
        try { renderFrame(frames[idx]); } catch (e) { console.error(e); return; }
        idx = (idx + 1) % frames.length;
        timer = setTimeout(draw, parseInt(overlay.querySelector("#interval").value) || 350);
    }

    versionInput.addEventListener("input", regenerate);
    regenerate();

    overlay.querySelector("#closeBtn").onclick = () => {
        running = false;
        if (timer) clearTimeout(timer);
        overlay.remove();
    };
}

export async function openReceiveDialog(onComplete) {
    await ensureLibs();

    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px";
    overlay.innerHTML = `
    <div style="background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:18px;max-width:520px;width:100%">
      <h3 style="margin:0 0 6px">Receive via QR</h3>
      <div class="muted small">Point your camera at the sender's QR code.</div>
      <video id="vid" autoplay playsinline muted style="width:100%;border-radius:10px;margin-top:10px;background:#000"></video>
      <div class="status" id="stat" style="margin-top:8px">Starting camera…</div>
      <div class="row" style="margin-top:10px">
        <button class="danger" id="closeBtn">Close</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    const vid = overlay.querySelector("#vid");
    const stat = overlay.querySelector("#stat");
    const recv = new TransferReceiver();
    let stream, raf;

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        vid.srcObject = stream;
    } catch (e) {
        stat.innerHTML = `<span class="err">Camera denied or unavailable.</span>`;
        return;
    }

    const cvs = document.createElement("canvas");

    function tick() {
        if (vid.readyState >= 2) {
            cvs.width = vid.videoWidth;
            cvs.height = vid.videoHeight;
            cvs.getContext("2d").drawImage(vid, 0, 0);
            const img = cvs.getContext("2d").getImageData(0, 0, cvs.width, cvs.height);
            // The sender draws inverted QR codes, so try both polarities
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });

            if (code) {
                const r = recv.add(code.data);
                if (r && !r.pending) {
                    stat.innerHTML = `<span class="ok">Complete! Reassembling data…</span>`;
                    stop();
                    onComplete && onComplete(r);
                    overlay.remove();
                    return;
                } else if (r) {
                    stat.textContent = `Receiving… ${recv.frames.size}/${recv.total} frames`;
                }
            }
        }
        raf = requestAnimationFrame(tick);
    }

    function stop() {
        cancelAnimationFrame(raf);
        stream?.getTracks().forEach(t => t.stop());
    }

    tick();
    overlay.querySelector("#closeBtn").onclick = () => { stop(); overlay.remove(); };
}