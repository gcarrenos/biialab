#!/usr/bin/env node
// Generates YouTube chapter indexes for every transcript in corpus/ using an
// OpenAI-compatible gateway (FINDCLIX_API_KEY). Output: chapters/full.json in
// the format update-metadata.mjs consumes. Resumable — already-generated
// videos are skipped on re-run.
//
//   FINDCLIX_API_KEY=... node scripts/clips/generate-chapters.mjs [--limit N]

import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.FINDCLIX_API_KEY;
if (!KEY) { console.error('Set FINDCLIX_API_KEY.'); process.exit(1); }
const MODEL = '@openai/gpt-oss-120b';
const FALLBACK_MODEL = '@meta/llama-4-scout-17b-16e-instruct';

const here = import.meta.dirname;
const corpusDir = path.join(here, 'corpus');
const outFile = path.join(here, 'chapters', 'full.json');
const limit = process.argv.includes('--limit') ? Number(process.argv[process.argv.indexOf('--limit') + 1]) : Infinity;

// Pilot videos already have hand-made chapters live — skip them.
const SKIP = new Set(['K1A0ua1Xhok', '5_s7M859KCk', 'a6iP8Z0IEbw']);

const existing = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};

function parseTime(t) {
  const [h, m, s] = t.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s.replace(',', '.'));
}

// Condense a VTT into ~15s windows, then sample evenly to ≤90 windows
function condense(vtt) {
  const cues = [];
  for (const block of vtt.split(/\n\n+/)) {
    const m = block.match(/([\d:.]+) --> ([\d:.]+)/);
    if (!m) continue;
    const text = block.slice(block.indexOf('\n') + 1).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (cues.length === 0 || !cues[cues.length - 1].text.includes(text)) {
      cues.push({ start: parseTime(m[1]), end: parseTime(m[2]), text });
    }
  }
  if (cues.length === 0) return null;
  const windows = [];
  let cur = null;
  for (const c of cues) {
    if (!cur || c.start - cur.start > 15) { if (cur) windows.push(cur); cur = { start: c.start, text: c.text }; }
    else cur.text += ' ' + c.text;
  }
  if (cur) windows.push(cur);
  const step = Math.max(1, Math.ceil(windows.length / 90));
  const sampled = windows.filter((_, i) => i % step === 0);
  return { sampled, duration: cues[cues.length - 1].end };
}

function fmt(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const files = fs.readdirSync(corpusDir).filter((f) => f.endsWith('.vtt'));
let done = 0, generated = 0;
for (const file of files) {
  const id = file.replace(/\.vtt$/, '');
  done++;
  if (SKIP.has(id) || existing[id]) { continue; }
  if (generated >= limit) break;

  const condensed = condense(fs.readFileSync(path.join(corpusDir, file), 'utf8'));
  if (!condensed) { console.log(`[${done}/${files.length}] ${id} EMPTY transcript, skipping`); continue; }
  const { sampled, duration } = condensed;
  const transcript = sampled.map((w) => `[${Math.round(w.start)}s] ${w.text.slice(0, 300)}`).join('\n');

  async function requestChapters(model) {
    const res = await fetch('https://ai.findclix.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 5000,
        messages: [
          {
            role: 'system',
            content:
              'Generas capítulos de YouTube en español para conferencias de desarrollo personal y negocios (BiiA LAB). ' +
              'Responde SOLO JSON válido: {"chapters":[{"seconds":int,"title":str}]}. Reglas: el primer capítulo es seconds=0; ' +
              'entre 8 y 18 capítulos según la duración; títulos en español, <55 caracteres, específicos y atractivos (no genéricos); ' +
              'los seconds deben coincidir con cambios de tema según las marcas de tiempo de la transcripción; orden estrictamente creciente.',
          },
          {
            role: 'user',
            content: `Transcripción muestreada (duración total ${Math.round(duration)}s):\n\n${transcript}\n\nGenera los capítulos.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 150));
    const msg = data.choices?.[0]?.message ?? {};
    // some backends put output in `reasoning`/`reasoning_content` with content null
    return (msg.content ?? msg.reasoning_content ?? msg.reasoning ?? '').replace(/```json|```/g, '').trim();
  }

  try {
    let text = await requestChapters(MODEL);
    if (!/\{[\s\S]*"chapters"[\s\S]*\}/.test(text)) text = await requestChapters(FALLBACK_MODEL);
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    const chapters = parsed.chapters
      .filter((c) => Number.isFinite(c.seconds) && c.seconds >= 0 && c.seconds < duration && c.title)
      .sort((a, b) => a.seconds - b.seconds);
    if (chapters.length < 3 || chapters[0].seconds !== 0) throw new Error(`bad chapters (${chapters.length}, first=${chapters[0]?.seconds})`);
    // YouTube requires each chapter ≥10s apart
    const clean = chapters.filter((c, i) => i === 0 || c.seconds - chapters[i - 1].seconds >= 10);
    existing[id] = '⏱️ Capítulos:\n' + clean.map((c) => `${fmt(c.seconds)} ${c.title.trim()}`).join('\n');
    generated++;
    fs.writeFileSync(outFile, JSON.stringify(existing, null, 1));
    console.log(`[${done}/${files.length}] ${id} ok (${clean.length} chapters)`);
  } catch (error) {
    console.log(`[${done}/${files.length}] ${id} FAILED: ${String(error).slice(0, 120)}`);
    await new Promise((r) => setTimeout(r, 10_000)); // back off after failures
  }
  await new Promise((r) => setTimeout(r, 1500)); // pace requests
}
console.log(`\nDone: ${Object.keys(existing).length} videos have chapters in ${outFile}`);
