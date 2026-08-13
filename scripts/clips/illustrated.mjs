#!/usr/bin/env node
// Illustrated audio Short: real talk audio over AI-illustrated beats,
// ken-burns motion, whisper captions + hook overlay. Config-driven:
//
//   FAL_KEY=... node scripts/clips/illustrated.mjs <config.json>
//
// config: { name, source, start, end, hook, accent, style, beats: [{dur, prompt}] }
// Output: out/illustrated/<name>/<name>.mp4  (images cached per beat)

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FAL_KEY = process.env.FAL_KEY;
const configFile = process.argv[2];
if (!FAL_KEY || !configFile) { console.error('Usage: FAL_KEY=... node illustrated.mjs <config.json>'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'));

const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const outDir = path.join(here, 'out', 'illustrated', cfg.name);
const model = path.join(here, 'models', 'ggml-large-v3-turbo.bin');
fs.mkdirSync(outDir, { recursive: true });

const totalBeats = cfg.beats.reduce((s, b) => s + b.dur, 0);
const audioDur = cfg.end - cfg.start;
if (Math.abs(totalBeats - audioDur) > 0.5) {
  console.error(`Beat durations (${totalBeats}s) must match audio ${audioDur}s`);
  process.exit(1);
}

async function generate(prompt, file) {
  const res = await fetch('https://fal.run/fal-ai/flux/dev', {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `${cfg.style}, ${prompt}`,
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
for (const [i, beat] of cfg.beats.entries()) {
  const file = path.join(outDir, `beat-${i + 1}.jpg`);
  if (!fs.existsSync(file)) {
    await generate(beat.prompt, file);
    console.log(`   beat ${i + 1}/${cfg.beats.length} ok`);
  }
}

console.log('2/4 Animating beats…');
const parts = [];
cfg.beats.forEach((beat, i) => {
  const img = path.join(outDir, `beat-${i + 1}.jpg`);
  const clip = path.join(outDir, `beat-${i + 1}.mp4`);
  const frames = Math.round(beat.dur * 30);
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
const fadeStart = Math.max(0, audioDur - 2.5);
execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(cfg.start), '-to', String(cfg.end), '-i', cfg.source,
  '-vn', '-af', `loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${fadeStart}:d=2.5`, '-c:a', 'aac', '-ar', '48000', audio]);

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
Dialogue: 2,0:00:00.00,0:00:03.80,Accent,,0,0,0,,{\\fad(100,150)\\frz-4}${cfg.accent}
Dialogue: 1,0:00:00.20,0:00:03.80,Hook,,0,0,0,,{\\fad(120,200)}${cfg.hook}
` + chunks.map((c) => `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${c.text}`).join('\n') + '\n');

console.log('4/4 Final mux…');
const final = path.join(outDir, `${cfg.name}.mp4`);
const vFade = Math.max(0, audioDur - 1.4);
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', visual, '-i', audio,
  '-vf', `ass=${assFile}:fontsdir=${fontsDir},fade=t=out:st=${vFade}:d=1.4`,
  '-map', '0:v', '-map', '1:a', '-c:a', 'copy', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
  '-shortest', final]);
console.log(`Done: ${final}`);
