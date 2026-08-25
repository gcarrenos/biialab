#!/usr/bin/env node
// Scans the transcript corpus (corpus/<videoId>.vtt) for first-person
// anecdotes: passages dense in narrative markers (past-tense "llegué", "me
// dijo", "un día", "hace X años", named people/places, dialogue). Ranks
// videos and prints the top story-dense windows per video, so clip.mjs is
// pointed at material that retains (stories ~95% vs concepts ~65%).
//
//   node scripts/clips/story-finder.mjs [--top 15] [--windows 3] [--min 40]

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const flag = (n, d) => (argv.includes(n) ? Number(argv[argv.indexOf(n) + 1]) : d);
const TOP = flag('--top', 15), WINDOWS = flag('--windows', 3), MIN = flag('--min', 40);
const here = import.meta.dirname;
const corpusDir = path.join(here, 'corpus');
const ledger = JSON.parse(fs.readFileSync(path.join(here, 'ledger.json'), 'utf8'));
const used = {};
for (const u of ledger.uploads) (used[u.sourceVideo] ??= []).push(u.segment);

// Titles via Data API when a key is present (cached in corpus/titles.json)
const titlesFile = path.join(corpusDir, 'titles.json');
let titles = fs.existsSync(titlesFile) ? JSON.parse(fs.readFileSync(titlesFile, 'utf8')) : {};

const MARKERS = [
  /\b(un d[ií]a|una vez|una noche|una ma[ñn]ana|hace (\d+|unos|muchos|dos|tres|cinco|diez|veinte) a[ñn]os|cuando (yo )?(ten[ií]a|era|estaba|llegu[ée]|viv[ií]a|trabajaba))\b/i,
  /\b(llegu[ée]|entr[ée]|sal[ií]|fui|vine|me fui|me sent[ée]|me par[ée]|me qued[ée]|abr[ií]|cerr[ée]|compr[ée]|vend[ií]|perd[ií]|gan[ée]|firm[ée]|llam[ée]|toqu[ée])\b/i,
  /\b(me dijo|le dije|me pregunt[oó]|le pregunt[ée]|me contest[oó]|me grit[oó]|me mir[oó]|le contest[ée]|me respondi[oó])\b/i,
  /\b(mi (mam[áa]|pap[áa]|hijo|hija|esposa|esposo|marido|abuela|abuelo|jefe|socio|hermano|hermana|t[ií]o|t[ií]a|suegra|amigo|amiga|cliente|maestro|profesor|vecino|vecina))\b/i,
  /\b(en (M[ée]xico|Colombia|Bogot[áa]|Miami|Panam[áa]|Per[úu]|Lima|Madrid|Argentina|Chile|Ecuador|Guatemala|Monterrey|Guadalajara|Medell[ií]n|Cali|Nueva York|Los [ÁA]ngeles|la oficina|el aeropuerto|el hospital|la tienda|el banco|la calle|el carro|la casa|el hotel|la cocina))\b/i,
  /["“«]|\bdice\b|\by yo\b|\by [ée]l\b|\by ella\b/i,
];

function parse(vtt) {
  const cues = [];
  for (const block of vtt.split(/\n\n+/)) {
    const m = block.match(/(\d\d):(\d\d):(\d\d)[.,]\d+ --> (\d\d):(\d\d):(\d\d)/);
    if (!m) continue;
    const t = block.slice(block.indexOf('\n') + 1).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (t && t !== cues.at(-1)?.text) cues.push({ start: +m[1] * 3600 + +m[2] * 60 + +m[3], text: t }); // auto-caption roll-up repeats lines
  }
  return cues;
}

const results = [];
for (const file of fs.readdirSync(corpusDir).filter((f) => f.endsWith('.vtt'))) {
  const id = file.replace(/\.[a-z]{2}\.vtt$|\.vtt$/, '');
  const cues = parse(fs.readFileSync(path.join(corpusDir, file), 'utf8'));
  if (cues.length < 20) continue;
  // score 45s windows
  const win = [];
  for (let i = 0; i < cues.length; i++) {
    const t0 = cues[i].start;
    let text = '', j = i;
    while (j < cues.length && cues[j].start - t0 < 45) { text += ' ' + cues[j].text; j++; }
    let score = 0;
    for (const re of MARKERS) { const n = (text.match(new RegExp(re.source, 'gi')) ?? []).length; score += Math.min(n, 4) * (re === MARKERS[2] ? 2 : 1); }
    win.push({ start: t0, end: Math.round(t0 + 45), score, text: text.trim() });
  }
  // top non-overlapping windows not already used
  win.sort((a, b) => b.score - a.score);
  const picked = [];
  for (const w of win) {
    if (picked.length >= WINDOWS) break;
    if (picked.some((p) => Math.abs(p.start - w.start) < 60)) continue;
    if ((used[id] ?? []).some(([s, e]) => w.start < e && w.end > s)) continue;
    picked.push(w);
  }
  const density = win.filter((w) => w.score >= 6).length / win.length;
  results.push({ id, title: titles[id] ?? id, density, top: picked, dur: cues.at(-1).start });
}
results.sort((a, b) => b.density - a.density);
const KEY = process.env.YOUTUBE_API_KEY;
const missing = results.slice(0, TOP).map((r) => r.id).filter((id) => !titles[id]);
if (KEY && missing.length) {
  const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${missing.join(',')}&key=${KEY}`);
  const d = await r.json();
  for (const it of d.items ?? []) titles[it.id] = it.snippet.title;
  fs.writeFileSync(titlesFile, JSON.stringify(titles, null, 1));
  for (const x of results) x.title = titles[x.id] ?? x.id;
}

console.log(`Story-dense videos (share of 45s windows with strong narrative markers), top ${TOP}:\n`);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
for (const r of results.slice(0, TOP)) {
  console.log(`▶ ${r.id}  ${(r.density * 100).toFixed(0)}% story density  (${fmt(r.dur)})  ${r.title.slice(0, 70)}`);
  for (const w of r.top) console.log(`    ${fmt(w.start)}-${fmt(w.end)}  score ${w.score}  "${w.text.slice(0, 110)}…"`);
}
