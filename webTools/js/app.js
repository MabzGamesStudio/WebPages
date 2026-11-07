// Tool storage (localStorage)
const TOOLS_KEY = "webtools.v1";
export const Tools = {
    list() { try { return JSON.parse(localStorage.getItem(TOOLS_KEY) || "[]") } catch { return [] } },
    save(list) { localStorage.setItem(TOOLS_KEY, JSON.stringify(list)) },
    add(tool) {
        const list = this.list();
        tool.id = tool.id || ("t_" + Math.random().toString(36).slice(2, 9));
        tool.createdAt = tool.createdAt || Date.now();
        list.push(tool); this.save(list); return tool;
    },
    remove(id) { this.save(this.list().filter(t => t.id !== id)) },
    get(id) { return this.list().find(t => t.id === id) },
    exportJSON() { return JSON.stringify(this.list(), null, 2) },
    importJSON(str) {
        const arr = JSON.parse(str);
        const cur = this.list(); const seen = new Set(cur.map(t => t.id));
        for (const t of arr) { if (!seen.has(t.id)) cur.push(t); }
        this.save(cur); return arr.length;
    }
};

/* ---------- Tool routing ----------
   Tools that ship with the site (seeded from tools-manifest.json, flagged _manifest) have a
   real page at tools/<id>.html. Everything created locally (Add page, Import, QR transfer) has
   no page on disk, so it is opened through the generic runner tools/local.html?id=<id>. */
export const LOCAL_RUNNER = "tools/local.html";
export function toolHref(tool, base = "./") {
    return tool._manifest
        ? `${base}tools/${encodeURIComponent(tool.id)}.html`
        : `${base}${LOCAL_RUNNER}?id=${encodeURIComponent(tool.id)}#${encodeURIComponent(tool.id)}`;
}
// Local tools that don't already exist on the site: not seeded from the manifest and
// not listed in it. This is what Export (Download / QR) sends.
export async function localOnlyTools(manifestUrl = "./tools-manifest.json") {
    let known = new Set();
    try {
        const res = await fetch(manifestUrl, { cache: "no-store" });
        if (res.ok) known = new Set((await res.json()).map(t => t.id));
    } catch { }
    return Tools.list().filter(t => !t._manifest && !known.has(t.id));
}

// Fuzzy search (Fuse.js-like) — tiny built-in
function fuzzyScore(query, text) {
    const q = query.toLowerCase(), t = text.toLowerCase();
    if (!q) return 0;
    if (t.includes(q)) return 1 + q.length / t.length;
    let qi = 0, score = 0, last = -1;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) { score += (i - last === 1 ? 2 : 1); last = i; qi++; }
    }
    return qi === q.length ? score / (t.length + 1) : 0;
}
export async function searchTools(query) {
    const tools = Tools.list();
    if (!query || !query.trim()) return tools.map(t => ({ doc: t, score: 0 }));

    // Fuzzy pass
    const fuzzy = tools.map(t => {
        const s = Math.max(
            fuzzyScore(query, t.name || ""),
            fuzzyScore(query, t.description || ""),
            ...(t.tags || []).map(tag => fuzzyScore(query, tag))
        );
        return { doc: t, score: s };
    }).filter(x => x.score > 0);

    // Embedding pass (lazy-loaded)
    let embed = [];
    try {
        const mod = await import("./embed.js");
        embed = mod.searchEmbed(query, tools, 30).map(x => ({ doc: x.doc, score: x.score * 0.6 }));
    } catch (e) { console.warn("embed unavailable", e); }

    // Merge scores
    const map = new Map();
    for (const r of [...fuzzy, ...embed]) {
        const k = r.doc.id;
        const cur = map.get(k) || { doc: r.doc, score: 0 };
        cur.score = Math.max(cur.score, r.score);
        map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.score - a.score);
}

// Extract tags from prompt heuristically
export function extractTags(text) {
    const stop = new Set(("the a an of and or to in on for with by is are as it this that tool app page web".split(" ")));
    const words = (text || "").toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || [];
    const freq = new Map();
    for (const w of words) { if (!stop.has(w)) freq.set(w, (freq.get(w) || 0) + 1); }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
}

/* ---------- QR TRANSFER ENGINE ----------
   Chunks large JSON into QR-friendly pieces. Each QR encodes a JSON frame:
   { i: index, n: total, id: transferId, d: base64chunk }
   Receiver collects frames by id, reassembles, parses.
----------------------------------------- */
const CHUNK_BYTES = 900; // safe for QR version ~20-25
function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
}
function b64decode(b64) {
    const bin = atob(b64); const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}
export function chunkPayload(obj, maxChunkBytes = 900) {
    const json = JSON.stringify(obj);
    const b64 = b64encode(json);
    const parts = [];
    // Slice the base64 string into chunks of the specified max size
    for (let i = 0; i < b64.length; i += maxChunkBytes) {
        parts.push(b64.slice(i, i + maxChunkBytes));
    }
    const id = Math.random().toString(36).slice(2, 10);
    return parts.map((d, i) => JSON.stringify({ i, n: parts.length, id, d }));
}
export function parseFrame(str) {
    try {
        const o = JSON.parse(str);
        if (typeof o.i === "number" && typeof o.n === "number" && o.id && typeof o.d === "string") return o;
    } catch { }
    return null;
}
export class TransferReceiver {
    constructor() { this.frames = new Map(); this.id = null; this.total = 0; }
    add(str) {
        const f = parseFrame(str); if (!f) return null;
        if (!this.id) { this.id = f.id; this.total = f.n; }
        if (f.id !== this.id) return null;
        this.frames.set(f.i, f.d);
        if (this.frames.size === this.total) {
            const ordered = [...Array(this.total)].map((_, i) => this.frames.get(i)).join("");
            try { return JSON.parse(b64decode(ordered)); } catch { return null; }
        }
        return { pending: this.total - this.frames.size };
    }
    reset() { this.frames = new Map(); this.id = null; this.total = 0; }
}