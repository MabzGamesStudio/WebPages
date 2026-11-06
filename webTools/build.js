#!/usr/bin/env node
// Build script: packages the webtools site into ../pages/webTools/
// - Scans ./pages/webTools/*.html for <!-- TOOL_META --> blocks
// - Copies index.html, add.html, css/, js/ with path rewrites
// - Writes each tool as a standalone HTML file
// - Writes tools-manifest.json for the built site
import { readdir, readFile, writeFile, mkdir, rm, copyFile, stat } from "node:fs/promises";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const SRC_TOOLS = join(ROOT, "tools");
const OUT = join(ROOT, "..", "pages", "webTools");

const STATIC_FILES = [
    "index.html",
    "add.html",
    { from: "css/styles.css", to: "css/styles.css" },
    { from: "js/app.js", to: "js/app.js" },
    { from: "js/embed.js", to: "js/embed.js" },
    { from: "js/transfer-ui.js", to: "js/transfer-ui.js" },
    { from: "js/lib/qrcode.min.js", to: "js/lib/qrcode.min.js" },
    { from: "js/lib/jsQR.js", to: "js/lib/jsQR.js" },
];

// ---------- helpers ----------
async function exists(p) { try { await stat(p); return true; } catch { return false; } }
async function ensureDir(p) { await mkdir(p, { recursive: true }); }

function parseToolMeta(html, fallbackId) {
    const m = html.match(/<!--\s*TOOL_META\s*([\s\S]*?)-->/i);
    let meta = {};
    if (m) { try { meta = JSON.parse(m[1]); } catch { meta = {}; } }
    return {
        id: meta.id || fallbackId,
        name: meta.name || fallbackId,
        description: meta.description || "",
        tags: Array.isArray(meta.tags) ? meta.tags : [],
    };
}

async function writeSourceManifest(tools) {
    const manifest = tools.map(t => ({
        id: t.id, name: t.name, description: t.description, tags: t.tags
    }));
    const dest = join(ROOT, "tools-manifest.json");
    await writeFile(dest, JSON.stringify(manifest, null, 2));
    console.log(`✓ source tools-manifest.json (${manifest.length} tools)`);
}

// Rewrite internal paths so the built site (flat) works:
//   ./pages/webTools/<id>.html  →  ./<id>.html
//   ../pages/webTools/...       →  ./...
function rewritePaths(html) {
    return html
        .replace(/\.\/pages\/webTools\//g, "./")
        .replace(/\.\.\/pages\/webTools\//g, "./");
}

// NEW: in source, tools live at webPages/pages/webTools/<id>.html, so "../../" = webPages/.
// In the build, tools sit beside css/, js/ and index.html, so "../../" becomes "./".
function rewriteToolPaths(html) {
    return html.replace(/(["'(=])\.\.\/\.\.\//g, "$1./");
}

// ---------- main ----------
async function clean() {
    if (await exists(OUT)) {
        await rm(OUT, { recursive: true, force: true });
        console.log("✓ cleaned", relative(ROOT, OUT));
    }
}

async function collectTools() {
    const tools = [];
    if (!(await exists(SRC_TOOLS))) return tools;
    const files = (await readdir(SRC_TOOLS)).filter(f => f.endsWith(".html"));
    for (const f of files) {
        const html = await readFile(join(SRC_TOOLS, f), "utf8");
        const id = f.replace(/\.html$/, "");
        const meta = parseToolMeta(html, id);
        tools.push({ ...meta, file: f, html });
    }
    // Merge with optional tools.json at root
    const tjPath = join(ROOT, "tools.json");
    if (await exists(tjPath)) {
        try {
            const extra = JSON.parse(await readFile(tjPath, "utf8"));
            const byId = new Map(tools.map(t => [t.id, t]));
            for (const t of extra) {
                if (!byId.has(t.id)) {
                    tools.push({
                        id: t.id, name: t.name, description: t.description || "",
                        tags: t.tags || [], file: `${t.id}.html`, html: t.code || ""
                    });
                } else {
                    // overlay metadata from tools.json onto existing
                    const cur = byId.get(t.id);
                    if (t.name) cur.name = t.name;
                    if (t.description) cur.description = t.description;
                    if (t.tags) cur.tags = t.tags;
                }
            }
            console.log("✓ merged tools.json");
        } catch (e) { console.warn("⚠ tools.json invalid:", e.message); }
    }
    return tools;
}

async function writeStatic() {
    for (const entry of STATIC_FILES) {
        const from = typeof entry === "string" ? entry : entry.from;
        const to = typeof entry === "string" ? entry : entry.to;
        const src = join(ROOT, from);
        if (!(await exists(src))) { console.warn("⚠ missing", from); continue; }
        const dest = join(OUT, to);
        await ensureDir(dirname(dest));
        if (to.endsWith(".html")) {
            await writeFile(dest, rewritePaths(await readFile(src, "utf8")));
        } else {
            await copyFile(src, dest);   // byte-for-byte, safe for any asset type
        }
        console.log("✓", to);
    }
}

async function writeTools(tools) {
    for (const t of tools) {
        const dest = join(OUT, `${t.id}.html`);
        await writeFile(dest, rewriteToolPaths(t.html));   // ← changed
        console.log("✓ tool:", t.id);
    }
}

async function writeManifest(tools) {
    const manifest = tools.map(t => ({
        id: t.id, name: t.name, description: t.description, tags: t.tags
    }));
    await writeFile(join(OUT, "tools-manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`✓ tools-manifest.json (${manifest.length} tools)`);
}

async function main() {
    const args = process.argv.slice(2);
    if (args.includes("--clean")) { await clean(); return; }

    console.log("building →", relative(ROOT, OUT));
    await clean();
    await ensureDir(OUT);

    const tools = await collectTools();
    await writeStatic();
    await writeTools(tools);
    await writeManifest(tools);
    await writeSourceManifest(tools);

    console.log(`\n✅ done. ${tools.length} tool(s) bundled.`);
}

main().catch(e => { console.error(e); process.exit(1); });