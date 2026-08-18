#!/usr/bin/env node
// Multi-source clean-footage batch: cuts 9:16 clips (blurred pad, big
// captions + hook, no comic frame) from a plan whose clips can span several
// source videos. Writes out/<batch>/metadata.json for upload.mjs.
//
//   node scripts/clips/clean-batch.mjs <batchDir>   (expects <batchDir>/plan.json)

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const model = path.join(here, 'models', 'ggml-large-v3-turbo.bin');
const batchDir = path.resolve(process.argv[2]);
const plan = JSON.parse(fs.readFileSync(path.join(batchDir, 'plan.json'), 'utf8'));

function parseTime(t) { const [h, m, s] = t.split(':'); return +h * 3600 + +m * 60 + +s.replace(',', '.'); }
function assTime(sec) { const s = Math.max(0, sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h}:${String(m).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`; }
const esc = (t) => t.replace(/[{}\\]/g, '');

const metadata = [];
plan.clips.forEach((clip, i) => {
  const n = i + 1;
  const source = path.join(here, 'out', clip.src, 'source.mp4');
  if (!fs.existsSync(source)) { console.error(`missing source ${clip.src}`); process.exit(1); }
  const raw = path.join(batchDir, `clip-${n}.raw.mp4`);
  const final = path.join(batchDir, `clip-${n}.mp4`);
  console.log(`clip-${n}: ${clip.title}`);

  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(clip.start), '-to', String(clip.end), '-i', source,
    '-vf', '[0:v]split[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20[bgb];[fg]scale=1080:-2[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2',
    '-c:a', 'aac', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', raw]);

  const wav = path.join(batchDir, `clip-${n}.wav`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vn', '-ar', '16000', '-ac', '1', wav]);
  execFileSync('whisper-cli', ['-m', model, '-f', wav, '-l', 'es', '-ml', '24', '-sow', '-ovtt', '-of', path.join(batchDir, `clip-${n}`)], { stdio: 'ignore' });
  fs.unlinkSync(wav);
  const vtt = fs.readFileSync(path.join(batchDir, `clip-${n}.vtt`), 'utf8');
  fs.unlinkSync(path.join(batchDir, `clip-${n}.vtt`));
  const chunks = [];
  for (const block of vtt.split(/\n\n+/)) {
    const m = block.match(/([\d:.]+) --> ([\d:.]+)/);
    if (!m) continue;
    const t = block.slice(block.indexOf('\n') + 1).replace(/\s+/g, ' ').trim();
    if (t) chunks.push({ start: parseTime(m[1]), end: parseTime(m[2]), text: t });
  }

  const ass = path.join(batchDir, `clip-${n}.ass`);
  fs.writeFileSync(ass, `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,Anton,86,&H0000E8FF,&H00FFFFFF,&H00000000,&HA0000000,0,0,0,0,100,100,1,0,1,6,2,8,70,70,390,1
Style: Caption,Archivo Black,76,&H00FFFFFF,&H00FFFFFF,&H00000000,&HA0000000,0,0,0,0,100,100,0,0,1,6,2,2,70,70,620,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 1,0:00:00.00,0:00:03.20,Hook,,0,0,0,,{\\fad(120,200)}${esc(clip.hook.toUpperCase())}
` + chunks.map((c) => `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${esc(c.text)}`).join('\n') + '\n');

  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vf', `ass=${ass}:fontsdir=${fontsDir}`,
    '-c:a', 'copy', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', final]);
  fs.unlinkSync(raw);

  metadata.push({
    file: `clip-${n}.mp4`, sourceVideoId: clip.src,
    sourceVideo: `https://www.youtube.com/watch?v=${clip.src}`,
    start: clip.start, end: clip.end, title: clip.title,
    description: `${clip.description}\n\nVideo completo: https://www.youtube.com/watch?v=${clip.src}`,
    hook: clip.hook, style: 'clean',
  });
});
fs.writeFileSync(path.join(batchDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
console.log(`\nDone: ${metadata.length} clips in ${batchDir}`);
