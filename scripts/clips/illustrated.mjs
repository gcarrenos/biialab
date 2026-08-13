#!/usr/bin/env node
// Illustrated audio Short: real talk audio over AI-illustrated beats in the
// brand ink/halftone style, ken-burns motion, whisper captions + comic hook.
//
//   FAL_KEY=... node scripts/clips/illustrated.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) { console.error('Set FAL_KEY.'); process.exit(1); }

const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const outDir = path.join(here, 'out', 'illustrated-1');
const model = path.join(here, 'models', 'ggml-large-v3-turbo.bin');
fs.mkdirSync(outDir, { recursive: true });

// The Schindler pin story — 5_s7M859KCk 2106-2165 (59s)
const SOURCE = path.join(here, 'out', '5_s7M859KCk', 'source.mp4');
const START = 2106, END = 2165;
const HOOK = 'SALVÓ 5.000 VIDAS.\\NMURIÓ LLORANDO POR UN PIN.';
const ACCENT = 'Jürgen Klarić';

const STYLE =
  'vintage comic book ink illustration, heavy black ink linework, halftone dot shading, ' +
  'cream aged paper background, dramatic chiaroscuro lighting, single orange accent color, ' +
  'film noir graphic novel style, 1940s period, no text, no symbols';

const BEATS = [
  { dur: 10, prompt: '1940s factory interior, silhouette of a businessman in a suit seen from behind watching rows of metal pots on an assembly line' },
  { dur: 10, prompt: 'tense negotiation across a wooden desk between a businessman in a suit and a stern military officer in a plain dark uniform, papers and a ledger between them, harsh single lamp' },
  { dur: 10, prompt: 'extreme close-up of an ornate golden lapel pin on a dark suit jacket, glinting warm orange light, shallow depth' },
  { dur: 10, prompt: 'military officer in plain dark uniform pointing at the lapel pin of a businessman, the businessman clutching his lapel protectively, tense faces in profile' },
  { dur: 12, prompt: 'a man alone on his knees weeping, holding a tiny golden pin in his open palm, dramatic shaft of light from above, dark background with faint silhouettes of a grateful crowd' },
  { dur: 7, prompt: 'a large crowd of men women and children standing together in warm dawn light on a hillside, hopeful, seen from behind, one small golden glint in the foreground' },
];

async function generate(prompt, file) {
  const res = await fetch('https://fal.run/fal-ai/flux/dev', {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `${STYLE}, ${prompt}`,
      image_size: { width: 768, height: 1344 },
      num_inference_steps: 28,
      guidance_scale: 3.5,
      enable_safety_checker: true,
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 200));
  const img = await fetch(data.images[0].url);
  fs.writeFileSync(file, Buffer.from(await img.arrayBuffer()));
}

function parseTime(t) { const [h, m, s] = t.split(':'); return +h * 3600 + +m * 60 + +s.replace(',', '.'); }
function assTime(sec) { const s = Math.max(0, sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h}:${String(m).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`; }

console.log('1/4 Generating illustrations…');
for (const [i, beat] of BEATS.entries()) {
  const file = path.join(outDir, `beat-${i + 1}.jpg`);
  if (!fs.existsSync(file)) {
    await generate(beat.prompt, file);
    console.log(`   beat ${i + 1}/${BEATS.length} ok`);
  }
}

console.log('2/4 Animating beats (ken burns)…');
const parts = [];
BEATS.forEach((beat, i) => {
  const img = path.join(outDir, `beat-${i + 1}.jpg`);
  const clip = path.join(outDir, `beat-${i + 1}.mp4`);
  const frames = Math.round(beat.dur * 30);
  // Alternate slow zoom in / out; upscale first so zoompan doesn't shimmer
  const zoom = i % 2 === 0
    ? `'min(1+0.12*on/${frames},1.12)'`
    : `'max(1.12-0.12*on/${frames},1.0)'`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-t', String(beat.dur), '-i', img,
    '-vf', `scale=-2:3840,crop=2160:3840,zoompan=z=${zoom}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1080x1920:fps=30`,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-r', '30', '-pix_fmt', 'yuv420p', '-an', clip]);
  parts.push(clip);
});

const listFile = path.join(outDir, 'concat.txt');
fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'));
const visual = path.join(outDir, 'visual.mp4');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', visual]);

console.log('3/4 Audio + captions…');
const audio = path.join(outDir, 'audio.m4a');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(START), '-to', String(END), '-i', SOURCE,
  '-vn', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-ar', '48000', audio]);

const wav = path.join(outDir, 'audio.wav');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', audio, '-ar', '16000', '-ac', '1', wav]);
execFileSync('whisper-cli', ['-m', model, '-f', wav, '-l', 'es', '-ml', '22', '-sow', '-ovtt', '-of', path.join(outDir, 'captions')], { stdio: 'ignore' });
fs.unlinkSync(wav);
const vtt = fs.readFileSync(path.join(outDir, 'captions.vtt'), 'utf8');
const chunks = [];
for (const block of vtt.split(/\n\n+/)) {
  const m = block.match(/([\d:.]+) --> ([\d:.]+)/);
  if (!m) continue;
  const t = block.slice(block.indexOf('\n') + 1).replace(/\s+/g, ' ').trim();
  if (t) chunks.push({ start: parseTime(m[1]), end: parseTime(m[2]), text: t.replace(/[{}]/g, '') });
}

const assFile = path.join(outDir, 'overlay.ass');
fs.writeFileSync(assFile, `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Accent,Permanent Marker,56,&H001AD9FF,&H00FFFFFF,&H001A1A1A,&H001A1A1A,0,0,0,0,100,100,0,3,1,4,0,8,70,70,240,1
Style: Hook,Anton,84,&H00144DFF,&H00FFFFFF,&H00F2E9D8,&H641A1A1A,0,0,0,0,100,100,1,0,1,6,3,8,60,60,310,1
Style: Caption,Archivo Black,66,&H00FFFFFF,&H00FFFFFF,&H001A1A1A,&HA0000000,0,0,0,0,100,100,0,0,1,6,2,2,70,70,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 2,0:00:00.00,0:00:03.80,Accent,,0,0,0,,{\\fad(100,150)\\frz-4}${ACCENT}
Dialogue: 1,0:00:00.20,0:00:03.80,Hook,,0,0,0,,{\\fad(120,200)}${HOOK}
` + chunks.map((c) => `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${c.text}`).join('\n') + '\n');

console.log('4/4 Final mux…');
const final = path.join(outDir, 'schindler-pin.mp4');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', visual, '-i', audio,
  '-vf', `ass=${assFile}:fontsdir=${fontsDir}`,
  '-map', '0:v', '-map', '1:a', '-c:a', 'copy', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
  '-shortest', final]);
console.log(`Done: ${final}`);
