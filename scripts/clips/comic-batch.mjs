#!/usr/bin/env node
// Comic-style production batch: fresh (ledger-unused) segments rendered in the
// brand-orange comic style into out/comic-batch-1/ with metadata.json ready
// for upload.mjs.
//
//   node scripts/clips/comic-batch.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const outDir = path.join(here, 'out', 'comic-batch-1');
const model = path.join(here, 'models', 'ggml-large-v3-turbo.bin');
fs.mkdirSync(outDir, { recursive: true });

const CLIPS = [
  {
    sourceVideoId: 'K1A0ua1Xhok',
    start: 714, end: 772,
    accent: 'Jürgen Klarić',
    hook: 'NO ENGAÑES A TUS HIJOS:\\NENSÉÑALES A VENDER',
    title: 'No engañes a tus hijos: enséñales a vender | Jürgen Klarić',
    description: '"Lo importante es sacar buenas calificaciones"… y así se arruina la mente de un hijo. Jürgen Klarić sobre lo que el colegio no enseña.\nCurso gratis completo en https://www.biialab.org\n#educacion #ventas #shorts',
  },
  {
    sourceVideoId: '5_s7M859KCk',
    start: 2365, end: 2423,
    accent: 'Neuro Riqueza',
    hook: 'SI PIENSAS ESTO, JAMÁS\\NTENDRÁS UN FERRARI',
    title: 'Si piensas esto, jamás tendrás un Ferrari | Jürgen Klarić',
    description: 'Pasa un Ferrari y dices "seguro es corrupto". Esa frase es exactamente lo que te mantiene con mente pobre, según Jürgen Klarić.\nCurso gratis completo en https://www.biialab.org\n#mentalidad #dinero #shorts',
  },
  {
    sourceVideoId: 'a6iP8Z0IEbw',
    start: 5880, end: 5938,
    accent: 'Mary Cardona',
    hook: 'TU TRABAJO NO ES\\NTENER EMOCIONES',
    title: 'Tu trabajo no es tener emociones | Mary Cardona',
    description: 'Es gestionarlas. Mary Cardona explica dónde descargar lo que sientes para que no te cobre factura.\nCurso gratis completo en https://www.biialab.org\n#inteligenciaemocional #bienestar #shorts',
  },
];

// Guard: refuse segments overlapping the ledger
const ledger = JSON.parse(fs.readFileSync(path.join(here, 'ledger.json'), 'utf8'));
for (const c of CLIPS) {
  const clash = ledger.uploads.find((u) => u.sourceVideo === c.sourceVideoId && c.start < u.segment[1] && c.end > u.segment[0]);
  if (clash) { console.error(`${c.title}: overlaps ledger segment ${clash.segment}`); process.exit(1); }
}

function parseTime(t) { const [h, m, s] = t.split(':'); return +h * 3600 + +m * 60 + +s.replace(',', '.'); }
function assTime(sec) { const s = Math.max(0, sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h}:${String(m).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`; }
const esc = (t) => t.replace(/[{}]/g, '');

function buildAss(clip, chunks) {
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Accent,Permanent Marker,58,&H001AD9FF,&H00FFFFFF,&H001A1A1A,&H001A1A1A,0,0,0,0,100,100,0,3,1,4,0,8,70,70,300,1
Style: Hook,Anton,88,&H00144DFF,&H00FFFFFF,&H001A1A1A,&H641A1A1A,0,0,0,0,100,100,1,0,1,6,3,8,60,60,370,1
Style: Caption,Archivo Black,70,&H001A1A1A,&H00FFFFFF,&H00D8E9F2,&H00D8E9F2,0,0,0,0,100,100,0,0,1,3,0,2,70,70,560,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 2,0:00:00.00,0:00:03.60,Accent,,0,0,0,,{\\fad(100,150)\\frz-4}${esc(clip.accent)}
Dialogue: 1,0:00:00.20,0:00:03.60,Hook,,0,0,0,,{\\fad(120,200)}${esc(clip.hook)}
` + chunks.map((c) => `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${esc(c.text)}`).join('\n') + '\n';
}

const metadata = [];
CLIPS.forEach((clip, i) => {
  const n = i + 1;
  const source = path.join(here, 'out', clip.sourceVideoId, 'source.mp4');
  if (!fs.existsSync(source)) { console.error(`source missing for ${clip.sourceVideoId}`); process.exit(1); }
  console.log(`clip-${n}: ${clip.title}`);
  const raw = path.join(outDir, `clip-${n}.raw.mp4`);
  const final = path.join(outDir, `clip-${n}.mp4`);

  const filter =
    `color=c=0xF2E9D8:s=1080x1920:d=1[base];` +
    `[base][1:v]overlay=0:0,drawbox=x=54:y=689:w=1004:h=574:color=0xFF4D14@1:t=fill[bg];` +
    `[0:v]scale=984:-2,eq=saturation=0.78:contrast=1.14,noise=alls=7:allf=t,` +
    `pad=w=iw+20:h=ih+20:x=10:y=10:color=0x1A1A1A[panel];` +
    `[bg][panel]overlay=38:673[comic]`;

  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(clip.start), '-to', String(clip.end), '-i', source,
    '-loop', '1', '-i', path.join(fontsDir, 'halftone.png'),
    '-filter_complex', filter, '-map', '[comic]', '-map', '0:a',
    '-c:a', 'aac', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-shortest', raw]);

  const wav = path.join(outDir, `clip-${n}.wav`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vn', '-ar', '16000', '-ac', '1', wav]);
  execFileSync('whisper-cli', ['-m', model, '-f', wav, '-l', 'es', '-ml', '22', '-sow', '-ovtt', '-of', path.join(outDir, `clip-${n}`)], { stdio: 'ignore' });
  fs.unlinkSync(wav);
  const vtt = fs.readFileSync(path.join(outDir, `clip-${n}.vtt`), 'utf8');
  fs.unlinkSync(path.join(outDir, `clip-${n}.vtt`));
  const chunks = [];
  for (const block of vtt.split(/\n\n+/)) {
    const m = block.match(/([\d:.]+) --> ([\d:.]+)/);
    if (!m) continue;
    const t = block.slice(block.indexOf('\n') + 1).replace(/\s+/g, ' ').trim();
    if (t) chunks.push({ start: parseTime(m[1]), end: parseTime(m[2]), text: t });
  }

  const assFile = path.join(outDir, `clip-${n}.ass`);
  fs.writeFileSync(assFile, buildAss(clip, chunks));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vf', `ass=${assFile}:fontsdir=${fontsDir}`,
    '-c:a', 'copy', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', final]);
  fs.unlinkSync(raw);

  metadata.push({
    file: `clip-${n}.mp4`,
    sourceVideoId: clip.sourceVideoId,
    sourceVideo: `https://www.youtube.com/watch?v=${clip.sourceVideoId}`,
    start: clip.start, end: clip.end,
    title: clip.title,
    description: `${clip.description}\n\nVideo completo: https://www.youtube.com/watch?v=${clip.sourceVideoId}`,
    hook: clip.hook,
    style: 'comic',
  });
});

fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
console.log(`\nDone: ${metadata.length} comic clips in ${outDir}`);
