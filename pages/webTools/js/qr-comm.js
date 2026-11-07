// js/qr-comm.js — DOM-free protocol core for QR Studio's "Communicate" tab.
//
// Two devices face each other, each with a screen and a camera.
//   Sender   -> Receiver : data frames    { t:"D", id, a, n, q, iv, w, d }
//   Receiver -> Sender   : control frames { t:"C", id, r, g, m, h, s, w, ok }
//
// The payload (base64 text) is cut into fixed ATOM-character atoms. A data frame carries a run
// of consecutive atoms starting at atom `a`, so how many atoms fit in one frame can change with
// the QR size without disturbing the receiver's bookkeeping.
//
// Data frame fields
//   id  transfer id            a  first atom in this frame     n  total atoms
//   q   frame counter (receiver counts gaps in q to estimate how many frames it is missing)
//   iv  sender tick (ms)       w  sender QR width (px)         d  atoms, concatenated
// Control frame fields
//   id  transfer id (null until the receiver has seen data)    r  report counter (stale ones ignored)
//   g   atoms received       m  missing ranges [[start,len],...]   ok  1 = everything received
//   h   hint id (each hint applies once)   s  tick hint: +1 faster / -1 slower
//   w   width hint: +1 wider (denser QR, more data per frame) / -1 narrower (coarser, easier to read)

export const ATOM = 16;
export const LIMITS = { IV_MIN: 100, IV_MAX: 2000, W_MIN: 160, W_MAX: 1024 };
export const QUIET = 2;
export const MIN_MODULE_PX = 4;
export const CTRL_MAX = 118;      // max characters in a control frame: keeps its QR coarse and easy to read
export const MAX_ATOMS = 99999;

// Byte-mode capacity at error-correction level H, QR versions 1..40 (index = version)
export const H_CAP = [0, 7, 14, 24, 36, 46, 60, 66, 86, 100, 122, 140, 158, 180, 197, 223, 253, 283, 313, 341,
    385, 406, 442, 464, 514, 538, 596, 628, 661, 701, 745, 793, 845, 901, 961, 986, 1054, 1096, 1142, 1222, 1273];

// Worst-case size of a data frame with no payload
export const DATA_OVERHEAD = JSON.stringify({
    t: "D", id: "xxxxxxxx", a: 99999, n: 99999, q: 9999999, iv: 2000, w: 1024, d: ""
}).length;

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const newId = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");

// Highest QR version whose modules still come out >= MIN_MODULE_PX at this width
export function versionForWidth(px) {
    const maxModules = Math.floor(px / MIN_MODULE_PX) - QUIET * 2;
    return clamp(Math.floor((maxModules - 17) / 4), 1, 40);
}
// Width -> QR version -> atoms per frame
export function planForWidth(px) {
    let v = versionForWidth(px);
    while (v < 40 && H_CAP[v] - DATA_OVERHEAD < ATOM) v++;     // width too tiny to be useful: bump up
    return { version: v, atoms: Math.max(1, Math.floor((H_CAP[v] - DATA_OVERHEAD) / ATOM)) };
}

function sanitizeRanges(m, N) {
    const out = [];
    for (const r of m) {
        if (!Array.isArray(r)) continue;
        const s = r[0], len = r[1];
        if (Number.isInteger(s) && Number.isInteger(len) && s >= 0 && len > 0 && s < N) out.push([s, Math.min(len, N - s)]);
    }
    return out.sort((x, y) => x[0] - y[0]);
}

/* ---------------------------------- SENDER ---------------------------------- */
export class SenderCore {
    constructor(b64, { iv = 400, px = 320 } = {}) {
        this.b64 = b64;
        this.N = Math.ceil(b64.length / ATOM);
        if (this.N < 1) throw new Error("Nothing to send.");
        if (this.N > MAX_ATOMS) throw new Error("Data is too large for this transfer (about 1.5 MB max).");
        this.id = newId();
        this.iv = clamp(iv, LIMITS.IV_MIN, LIMITS.IV_MAX);
        this.px = clamp(px, LIMITS.W_MIN, LIMITS.W_MAX);
        this.q = 0;
        this.cursor = 0;            // next atom to send
        this.missing = null;        // receiver's missing ranges, or null = loop over everything
        this.lastR = -1; this.lastH = -1;
        this.got = 0;               // atoms the receiver says it has
        this.receiverSeen = false;
        this.done = false;
    }

    // Next frame to display. Loops over the whole payload; once the receiver has reported what it is
    // missing, it loops over just those ranges (continuing forward from where it was).
    nextFrame() {
        const plan = planForWidth(this.px);
        const R = this.missing || [[0, this.N]];
        let a = -1, end = 0;
        for (const [s, len] of R) {
            if (this.cursor < s + len) { a = Math.max(this.cursor, s); end = s + len; break; }
        }
        if (a < 0) { a = R[0][0]; end = a + R[0][1]; }          // wrapped around
        const cnt = Math.min(plan.atoms, end - a);
        this.cursor = a + cnt;
        const text = JSON.stringify({
            t: "D", id: this.id, a, n: this.N, q: this.q++, iv: this.iv, w: this.px,
            d: this.b64.slice(a * ATOM, (a + cnt) * ATOM)
        });
        return { text, version: plan.version, a, cnt };
    }

    // Feed a decoded control frame. Returns "done" | "report" | "hello" | "stale" | "ignored".
    handleControl(c) {
        if (!c || c.t !== "C") return "ignored";
        if (c.id && c.id !== this.id) return "ignored";           // some other transfer
        this.receiverSeen = true;
        if (c.ok && c.id === this.id) { this.done = true; this.got = this.N; return "done"; }
        if (!c.id) return "hello";                                // receiver is listening but has seen no data yet
        if (!Number.isInteger(c.r) || c.r <= this.lastR) return "stale";
        this.lastR = c.r;
        if (Number.isInteger(c.g)) this.got = clamp(c.g, 0, this.N);
        if (Array.isArray(c.m)) {
            const m = sanitizeRanges(c.m, this.N);
            this.missing = m.length ? m : null;
        }
        if (Number.isInteger(c.h) && c.h > this.lastH) {          // each hint applies once
            this.lastH = c.h;
            if (c.s) this.iv = clamp(Math.round(this.iv * (c.s > 0 ? 0.75 : 1.35)), LIMITS.IV_MIN, LIMITS.IV_MAX);
            if (c.w) this.px = clamp(Math.round(this.px * (c.w > 0 ? 1.25 : 0.8) / 16) * 16, LIMITS.W_MIN, LIMITS.W_MAX);
        }
        return "report";
    }
}

/* --------------------------------- RECEIVER --------------------------------- */
export class ReceiverCore {
    constructor() { this.r = 0; this.hid = 0; this.reset(); }

    reset() {
        this.id = null; this.n = 0; this.atoms = []; this.got = 0; this.done = false;
        this.q = [];                               // recent distinct frame counters seen
        this.iv = 0; this.w = 0;                   // sender's current tick / width
        this.alt = false; this.lastKind = "";
        this.hint = null; this.hintUntil = 0; this.lastHintAt = 0; this.lastEval = 0;
        this.missRate = null; this.lastFrameAt = 0; this.startedAt = 0;
    }

    // Feed a decoded data frame. Returns "new" | "dup" | "done" | "ignored".
    handleData(f, now = Date.now()) {
        if (!f || f.t !== "D" || typeof f.id !== "string" || typeof f.d !== "string" ||
            !Number.isInteger(f.a) || !Number.isInteger(f.n) || !Number.isInteger(f.q) ||
            f.n < 1 || f.n > MAX_ATOMS || f.a < 0 || f.a >= f.n) return "ignored";
        if (this.done) return "ignored";

        if (this.id !== f.id) {
            // First transfer wins, unless it has gone quiet (sender restarted with new data).
            if (this.id && now - this.lastFrameAt < 5000) return "ignored";
            this.reset();
            this.id = f.id; this.n = f.n; this.atoms = new Array(f.n); this.startedAt = now;
        } else if (f.n !== this.n) return "ignored";

        this.lastFrameAt = now;
        if (Number.isInteger(f.iv)) this.iv = f.iv;
        if (Number.isInteger(f.w)) this.w = f.w;

        const last = this.q[this.q.length - 1];
        if (last === undefined || f.q > last) { this.q.push(f.q); if (this.q.length > 16) this.q.shift(); }

        let fresh = 0;
        for (let j = 0; j * ATOM < f.d.length; j++) {
            const i = f.a + j;
            if (i >= this.n) break;
            const piece = f.d.slice(j * ATOM, (j + 1) * ATOM);
            if (piece.length !== ATOM && i !== this.n - 1) break;   // malformed: only the last atom may be short
            if (this.atoms[i] === undefined) { this.atoms[i] = piece; this.got++; fresh++; }
        }
        if (this.got === this.n) { this.done = true; return "done"; }
        return fresh ? "new" : "dup";
    }

    assemble() { return this.atoms.join(""); }

    missingRanges(max = 30) {
        const out = [];
        let i = 0;
        while (i < this.n && out.length < max) {
            if (this.atoms[i] !== undefined) { i++; continue; }
            let j = i;
            while (j < this.n && this.atoms[j] === undefined) j++;
            out.push([i, j - i]);
            i = j;
        }
        return out;
    }

    // Decide whether the sender should change tick speed or QR width, from how many frames we are missing.
    evaluate(now = Date.now()) {
        if (this.done || !this.id || now - this.lastEval < 1000) return;
        this.lastEval = now;
        if (now - this.lastHintAt < 2500 || this.q.length < 8) return;     // let the last change settle

        const span = this.q[this.q.length - 1] - this.q[0] + 1;
        const miss = 1 - this.q.length / span;
        this.missRate = miss;
        const { IV_MIN, IV_MAX, W_MIN, W_MAX } = LIMITS;
        let s = 0, wd = 0;
        if (miss > 0.35) {
            // Struggling: undo whatever we asked for last; otherwise blame width when already slow, speed when fast.
            const blameWidth = this.lastKind === "w+" || (this.lastKind !== "s+" && this.iv >= 500);
            if (blameWidth && this.w > W_MIN) wd = -1;
            else if (this.iv < IV_MAX) s = -1;
            else if (this.w > W_MIN) wd = -1;
        } else if (miss < 0.08) {
            // Clean: push throughput, alternating between faster ticks and wider (denser) QR codes.
            this.alt = !this.alt;
            if (this.alt && this.iv > IV_MIN * 1.3) s = 1;
            else if (this.w && this.w < W_MAX) wd = 1;
            else if (this.iv > IV_MIN * 1.3) s = 1;
        }
        if (s || wd) {
            this.hint = { h: ++this.hid, s, w: wd };
            this.hintUntil = now + 1300;           // repeated in a few reports so one missed scan doesn't lose it
            this.lastHintAt = now;
            this.lastKind = s > 0 ? "s+" : s < 0 ? "s-" : wd > 0 ? "w+" : "w-";
            this.q = [];                           // measure the new settings from scratch
        }
    }

    // The control frame to display right now (JSON string, kept under CTRL_MAX characters).
    buildControl(now = Date.now()) {
        const base = { t: "C", id: this.id, r: ++this.r, g: this.got };
        if (this.done) return JSON.stringify({ ...base, ok: 1 });
        if (this.hint && now < this.hintUntil) Object.assign(base, this.hint);
        let out = JSON.stringify(base);
        if (!this.id) return out;
        const keep = [];
        for (const rg of this.missingRanges(30)) {
            const t = JSON.stringify({ ...base, m: [...keep, rg] });
            if (t.length > CTRL_MAX && keep.length) break;
            keep.push(rg); out = t;
        }
        return out;
    }
}
