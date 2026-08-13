#!/usr/bin/env node
// Comic-style Short demos: cream paper bg + halftone texture, video framed as
// an ink panel with red offset shadow, grain, and the hand-marker-over-red
// typography treatment. Renders from already-downloaded sources.
//
//   node scripts/clips/demo-comic.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const outDir = path.join(here, 'out', 'demos-comic');
const model = path.join(here, 'models', 'ggml-large-v3-turbo.bin');
fs.mkdirSync(outDir, { recursive: true });

const DEMOS = [
  {
    name: 'demo-1-secuestrador',
    source: path.join(here, 'out', 'K1A0ua1Xhok', 'source.mp4'),
    start: 504, end: 560,
    accent: 'Jürgen Klarić',
    hook: 'TU VENDEDOR ESTRELLA\\NTE TIENE SECUESTRADO',
  },
  {
    name: 'demo-2-mentalmente-pobres',
    source: path.join(here, 'out', '5_s7M859KCk', 'source.mp4'),
    start: 31, end: 80,
    accent: 'Neuro Riqueza',
    hook: 'NO SOMOS POBRES.\\NSOMOS MENTALMENTE POBRES.',
  },
  {
    name: 'demo-3-sonrisita',
    source: path.join(here, 'out', 'a6iP8Z0IEbw', 'source.mp4'),
    start: 2170, end: 2226,
    accent: 'Mary Cardona',
    hook: 'LA "SONRISITA" QUE\\NPREOCUPÓ A SU MAMÁ',
  },
];

function parseTime(t) {
  const [h, m, s] = t.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s.replace(',', '.'));
}
function assTime(sec) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
}
const esc = (t) => t.replace(/[{}]/g, '');

// Comic palette (ASS colours are &HAABBGGRR)
// ink #1A1A1A, red #E0161E -> &H001E16E0, yellow #FFD91A -> &H001AD9FF,
// cream #F2E9D8 -> &H00D8E9F2
function buildAss(demo, chunks) {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Accent,Permanent Marker,58,&H001AD9FF,&H00FFFFFF,&H001A1A1A,&H001A1A1A,0,0,0,0,100,100,0,3,1,4,0,8,70,70,300,1
Style: Hook,Anton,88,&H001E16E0,&H00FFFFFF,&H001A1A1A,&H641A1A1A,0,0,0,0,100,100,1,0,1,6,3,8,60,60,370,1
Style: Caption,Archivo Black,70,&H001A1A1A,&H00FFFFFF,&H00D8E9F2,&H00D8E9F2,0,0,0,0,100,100,0,0,1,3,0,2,70,70,560,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 2,0:00:00.00,0:00:03.60,Accent,,0,0,0,,{\\fad(100,150)\\frz-4}${esc(demo.accent)}
Dialogue: 1,0:00:00.20,0:00:03.60,Hook,,0,0,0,,{\\fad(120,200)}${esc(demo.hook)}
`;
  const lines = chunks.map((c) =>
    `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${esc(c.text)}`);
  return header + lines.join('\n') + '\n';
}

for (const demo of DEMOS) {
  if (!fs.existsSync(demo.source)) { console.log(`${demo.name}: source missing, skipping`); continue; }
  console.log(`${demo.name}: rendering…`);
  const raw = path.join(outDir, `${demo.name}.raw.mp4`);
  const final = path.join(outDir, `${demo.name}.mp4`);

  // Pass 1 — comic panel composition:
  //   halftone cream bg -> red offset panel -> video (desat + grain + ink border)
  // 16:9 video at width 984 -> height 554; +2*10 ink border -> 1004x574
  // centered: x=38, y=673. Red shadow panel offset +16px.
  const filter =
    `color=c=0xF2E9D8:s=1080x1920:d=1[base];` +
    `[base][1:v]overlay=0:0,drawbox=x=54:y=689:w=1004:h=574:color=0xE0161E@1:t=fill[bg];` +
    `[0:v]scale=984:-2,eq=saturation=0.78:contrast=1.14,noise=alls=7:allf=t,` +
    `pad=w=iw+20:h=ih+20:x=10:y=10:color=0x1A1A1A[panel];` +
    `[bg][panel]overlay=38:673[comic]`;

  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    '-ss', String(demo.start), '-to', String(demo.end), '-i', demo.source,
    '-loop', '1', '-i', path.join(fontsDir, 'halftone.png'),
    '-filter_complex', filter, '-map', '[comic]', '-map', '0:a',
    '-c:a', 'aac', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-shortest',
    raw,
  ]);

  // Whisper the clip for tight caption chunks
  const wav = path.join(outDir, `${demo.name}.wav`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vn', '-ar', '16000', '-ac', '1', wav]);
  execFileSync('whisper-cli', ['-m', model, '-f', wav, '-l', 'es', '-ml', '22', '-sow', '-ovtt', '-of', path.join(outDir, demo.name)], { stdio: 'ignore' });
  fs.unlinkSync(wav);
  const vtt = fs.readFileSync(path.join(outDir, `${demo.name}.vtt`), 'utf8');
  fs.unlinkSync(path.join(outDir, `${demo.name}.vtt`));
  const chunks = [];
  for (const block of vtt.split(/\n\n+/)) {
    const m = block.match(/([\d:.]+) --> ([\d:.]+)/);
    if (!m) continue;
    const t = block.slice(block.indexOf('\n') + 1).replace(/\s+/g, ' ').trim();
    if (t) chunks.push({ start: parseTime(m[1]), end: parseTime(m[2]), text: t });
  }

  // Pass 2 — burn typography
  const assFile = path.join(outDir, `${demo.name}.ass`);
  fs.writeFileSync(assFile, buildAss(demo, chunks));
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', raw, '-vf', `ass=${assFile}:fontsdir=${fontsDir}`,
    '-c:a', 'copy', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21',
    final,
  ]);
  fs.unlinkSync(raw);
  console.log(`${demo.name}: done`);
}
console.log(`\nDemos in ${outDir}`);
