#!/usr/bin/env node
// Build script: packages the webtools site into ../pages/webTools/
// - Recursively scans ./tools/**/index.html for <!-- TOOL_META --> blocks
// - Copies index.html, add.html, css/, js/ with path rewrites
// - Writes each tool as a folder with index.html (e.g., webTools/qr-tool/index.html)
// - Writes tools-manifest.json for the built site

import { readdir, readFile, writeFile, mkdir, rm, stat, copyFile } from "node:fs/promises";
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
    { from: "js/qr-comm.js", to: "js/qr-comm.js" },
    { from: "js/transfer-ui.js", to: "js/transfer-ui.js" },
    { from: "js/lib/qrcode.min.js", to: "js/lib/qrcode.min.js" },
    { from: "js/lib/jsQR.js", to: "js/lib/jsQR.js" },
];

// ---------- helpers ----------
async function exists(p) {
    try { await stat(p); return true; } catch { return false; }
}

async function ensureDir(p) {
    await mkdir(p, { recursive: true });
}

function parseToolMeta(html, fallbackId) {
    const m = html.match(/<!--\s*TOOL_META\s*([\s\S]*?)-->/i);
    let meta = {};
    if (m) {
        try { meta = JSON.parse(m[1]); } catch { meta = {}; }
    }
    return {
        id: meta.id || fallbackId,
        name: meta.name || fallbackId,
        description: meta.description || "",
        tags: Array.isArray(meta.tags) ? meta.tags : [],
    };
}

// Recursive function to find all index.html files in the tools directory
async function findToolFiles(dir) {
    let results = [];
    if (!(await exists(dir))) return results;

    const list = await readdir(dir);
    for (const f of list) {
        const fullPath = join(dir, f);
        const s = await stat(fullPath);

        if (s.isDirectory()) {
            // Recurse into subdirectories
            results = results.concat(await findToolFiles(fullPath));
        } else if (f === "index.html") {
            // Found a tool entry point
            results.push(fullPath);
        }
    }
    return results;
}

async function writeSourceManifest(tools) {
    const manifest = tools.map(t => ({
        id: t.id, name: t.name, description: t.description, tags: t.tags
    }));
    const dest = join(ROOT, "tools-manifest.json");
    await writeFile(dest, JSON.stringify(manifest, null, 2));
    console.log(`✓ source tools-manifest.json (${manifest.length} tools)`);
}

// Rewrite internal paths so the built site works correctly from subfolders
// Tools are now in webTools/<id>/index.html
// Assets are in webTools/css/, webTools/js/
// So we need to go up one level: ../css/styles.css
function rewritePaths(html) {
    return html
        // Ensure paths going up 2 levels (../../) remain as ../../ 
        // so they can reach webTools/ from webTools/tools/tool-name/
        .replace(/(["'(=])\.\.\/\.\.\/css\//g, "$1../../css/")
        .replace(/(["'(=])\.\.\/\.\.\/js\//g, "$1../../js/")

        // Fix any single-level relative paths that might be broken
        // If source had ../css, it needs to become ../../css now
        .replace(/(["'(=])\.\.\/css\//g, "$1../../css/")
        .replace(/(["'(=])\.\.\/js\//g, "$1../../js/")

        // Clean up absolute project paths if they exist
        .replace(/\.\/pages\/webTools\//g, "./")
        .replace(/\.\.\/pages\/webTools\//g, "../");
}

// Additional rewrite specifically for tools moving from flat to nested
// In source, tools might link to assets via ../../css because they are deeply nested in src/tools/x/y/
// In build, they are only one level deep: webTools/x/
// So ../../ becomes ../
function rewriteToolPaths(html) {
    // This handles the specific case where source tools were very deep
    // But generally rewritePaths above handles the ../../ -> ../ conversion
    return html;
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
    const toolFiles = await findToolFiles(SRC_TOOLS);

    for (const filePath of toolFiles) {
        const html = await readFile(filePath, "utf8");

        // Determine ID based on the immediate parent folder name
        // e.g., tools/qr-tool/index.html -> qr-tool
        const parentDir = basename(dirname(filePath));
        const id = parentDir !== "tools" ? parentDir : basename(filePath, ".html");

        const meta = parseToolMeta(html, id);
        tools.push({ ...meta, file: filePath, html, srcDir: dirname(filePath) });
    }

    // Merge with optional tools.json at root if it exists
    const tjPath = join(ROOT, "tools.json");
    if (await exists(tjPath)) {
        try {
            const extra = JSON.parse(await readFile(tjPath, "utf8"));
            const byId = new Map(tools.map(t => [t.id, t]));

            for (const t of extra) {
                if (!byId.has(t.id)) {
                    tools.push({
                        id: t.id, name: t.name, description: t.description || "",
                        tags: t.tags || [], file: null, html: t.code || "", srcDir: null
                    });
                } else {
                    // Overlay metadata from tools.json onto existing file-based tools
                    const cur = byId.get(t.id);
                    if (t.name) cur.name = t.name;
                    if (t.description) cur.description = t.description;
                    if (t.tags) cur.tags = t.tags;
                }
            }
            console.log("✓ merged tools.json");
        } catch (e) {
            console.warn("⚠ tools.json invalid:", e.message);
        }
    }
    return tools;
}

async function writeStatic() {
    for (const entry of STATIC_FILES) {
        const from = typeof entry === "string" ? entry : entry.from;
        const to = typeof entry === "string" ? entry : entry.to;
        const src = join(ROOT, from);

        if (!(await exists(src))) {
            console.warn("⚠ missing static file:", from);
            continue;
        }

        const dest = join(OUT, to);
        await ensureDir(dirname(dest));

        if (to.endsWith(".html")) {
            // Rewrite paths in HTML files
            // Root HTML files (index.html, add.html) link to css/ and js/ directly
            // So ./css/styles.css is correct for them.
            const content = await readFile(src, "utf8");
            // For root files, we don't need to change ../ to ../ because they are at root
            // But we still clean up any weird absolute paths
            const cleaned = content
                .replace(/\.\/pages\/webTools\//g, "./")
                .replace(/\.\.\/pages\/webTools\//g, "./");

            await writeFile(dest, cleaned);
        } else {
            // Copy assets byte-for-byte
            await copyFile(src, dest);
        }
        console.log("✓ static:", to);
    }
}

async function writeTools(tools) {
    for (const t of tools) {
        // Create folder structure: webTools/<id>/index.html
        const toolDir = join(OUT, "tools", t.id);
        await ensureDir(toolDir);

        const dest = join(toolDir, "index.html");

        // Apply path rewriting to tool HTML
        // Tools are now in webTools/<id>/index.html
        // They need to reach webTools/css/ via ../css/
        let processedHtml = rewritePaths(t.html);

        // If the tool was originally very deep in source, it might have had multiple ../
        // The rewritePaths function handles ../../ -> ../

        await writeFile(dest, processedHtml);
        console.log("✓ tool:", `${t.id}/index.html`);
    }
}

async function writeManifest(tools) {
    const manifest = tools.map(t => ({
        id: t.id, name: t.name, description: t.description, tags: t.tags
    }));
    await writeFile(join(OUT, "tools-manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`✓ built tools-manifest.json (${manifest.length} tools)`);
}

async function main() {
    const args = process.argv.slice(2);
    if (args.includes("--clean")) { await clean(); return; }

    console.log("building →", relative(ROOT, OUT));
    await clean();
    await ensureDir(OUT);

    const tools = await collectTools();

    if (tools.length === 0) {
        console.warn("⚠ No tools found in ./tools directory.");
    }

    await writeStatic();
    await writeTools(tools);
    await writeManifest(tools);
    await writeSourceManifest(tools);

    console.log(`\n✅ done. ${tools.length} tool(s) bundled.`);
}

main().catch(e => { console.error(e); process.exit(1); });