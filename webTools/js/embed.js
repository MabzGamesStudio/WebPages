// Lightweight semantic-ish scorer: tokenizes, weights rare terms,
// and uses cosine similarity on TF vectors. Good enough for "simple word embeddings"
// in a static site without a model.
const STOP = new Set(("a an the and or but if then else of in on at to for from by with " +
    "as is are was were be been being it its this that these those i you we they he she " +
    "my your our their his her me us them do does did have has had will would should can " +
    "could may might just very so such not no yes").split(/\s+/));

function tokenize(s) {
    return (s || "").toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/).filter(t => t && t.length > 1 && !STOP.has(t));
}
function tf(tokens) {
    const m = new Map();
    for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
    return m;
}
function buildCorpus(docs) {
    // docs: [{id, text}]
    const N = docs.length;
    const df = new Map();
    const tfs = docs.map(d => {
        const toks = tokenize(d.text);
        const uniq = new Set(toks);
        for (const t of uniq) df.set(t, (df.get(t) || 0) + 1);
        return tf(toks);
    });
    const idf = new Map();
    for (const [t, c] of df) idf.set(t, Math.log(1 + N / (1 + c)));
    return { tfs, idf, N };
}
function vec(tfMap, idf) {
    const v = new Map();
    for (const [t, c] of tfMap) {
        v.set(t, c * (idf.get(t) || 0));
    }
    return v;
}
function cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (const [k, x] of a) { na += x * x; if (b.has(k)) dot += x * b.get(k); }
    for (const [, y] of b) { nb += y * y; }
    if (!na || !nb) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
export function searchEmbed(query, docs, topK = 20) {
    if (!docs.length) return [];
    const corpus = buildCorpus(docs.map(d => ({ id: d.id, text: [d.name, d.description, (d.tags || []).join(" ")].join(" ") })));
    const qv = vec(tf(tokenize(query)), corpus.idf);
    const scored = docs.map((d, i) => {
        const dv = vec(corpus.tfs[i], corpus.idf);
        return { doc: d, score: cosine(qv, dv) };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
    return scored;
}