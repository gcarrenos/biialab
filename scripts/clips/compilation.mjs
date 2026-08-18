#!/usr/bin/env node
// Long-form compilation builder: stitches the best moments from the archive
// into a chaptered 1080p video with comic-style title cards between segments
// and an end-card CTA. Output crosses the 8-minute mid-roll threshold.
//
//   node scripts/clips/compilation.mjs [config.json]

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const cfg = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : null;
const outDir = path.join(here, 'out', cfg?.name ?? 'compilation-1');
fs.mkdirSync(outDir, { recursive: true });

// Ordered for narrative arc: hook story -> mindset -> money psychology ->
// practical selling -> the live pitch as climax -> kids/legacy close.
const SEGMENTS = cfg?.segments ?? [
  { src: 'K1A0ua1Xhok', start: 437, end: 568, title: 'Un policía en mi propia oficina' },
  { src: '5_s7M859KCk', start: 31, end: 85, title: 'Somos mentalmente pobres' },
  { src: '5_s7M859KCk', start: 413, end: 470, title: 'Piensa como millonario' },
  { src: '5_s7M859KCk', start: 490, end: 550, title: 'Pobre es el que persigue el dinero' },
  { src: '5_s7M859KCk', start: 2365, end: 2425, title: 'La envidia que te mantiene pobre' },
  { src: 'K1A0ua1Xhok', start: 1593, end: 1655, title: 'Todo lo que compras es por miedo' },
  { src: 'K1A0ua1Xhok', start: 1190, end: 1250, title: 'El peor error de un vendedor' },
  { src: 'K1A0ua1Xhok', start: 2282, end: 2350, title: 'Así se vende: el pitch de Panamá' },
  { src: 'K1A0ua1Xhok', start: 714, end: 775, title: 'Enséñales a vender a tus hijos' },
];

const ENC = ['-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-r', '30',
  '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-pix_fmt', 'yuv420p'];

function cardAss(file, lines) {
  fs.writeFileSync(file, `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Num,Permanent Marker,64,&H001AD9FF,&H00FFFFFF,&H001A1A1A,&H001A1A1A,0,0,0,0,100,100,0,3,1,4,0,8,80,80,300,1
Style: Title,Anton,110,&H00144DFF,&H00FFFFFF,&H001A1A1A,&H641A1A1A,0,0,0,0,100,100,1,0,1,7,3,5,120,120,0,1
Style: Sub,Archivo Black,44,&H001A1A1A,&H00FFFFFF,&H00D8E9F2,&H00D8E9F2,0,0,0,0,100,100,0,0,1,3,0,2,80,80,180,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`);
}

const parts = [];
let cursor = 0;
const chapters = [];

function renderCard(name, assLines, seconds) {
  const assFile = path.join(outDir, `${name}.ass`);
  cardAss(assFile, assLines);
  const file = path.join(outDir, `${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-v', 'error',
    '-loop', '1', '-t', String(seconds), '-i', path.join(fontsDir, 'halftone-wide.png'),
    '-f', 'lavfi', '-t', String(seconds), '-i', 'anullsrc=r=48000:cl=stereo',
    '-vf', `ass=${assFile}:fontsdir=${fontsDir}`, '-shortest', ...ENC, file]);
  parts.push(file);
  cursor += seconds;
}

// Opening card
renderCard('card-open', [
  `Dialogue: 1,0:00:00.00,0:00:03.50,Num,,0,0,0,,{\\fad(150,200)\\frz-3}BiiA LAB presenta`,
  `Dialogue: 0,0:00:00.30,0:00:03.50,Title,,0,0,0,,{\\fad(150,250)}${cfg?.openTitle ?? 'LO MEJOR DE\\NJÜRGEN KLARIĆ'}`,
  `Dialogue: 0,0:00:00.60,0:00:03.50,Sub,,0,0,0,,${cfg?.openSub ?? 'Neuroventas y mentalidad'}`,
], 3.5);

SEGMENTS.forEach((seg, i) => {
  const n = i + 1;
  // Chapter marker points at the title card
  chapters.push({ at: cursor, title: seg.title });

  renderCard(`card-${n}`, [
    `Dialogue: 1,0:00:00.00,0:00:02.50,Num,,0,0,0,,{\\fad(120,150)\\frz-3}${seg.speaker ?? String(n).padStart(2, '0')}`,
    `Dialogue: 0,0:00:00.20,0:00:02.50,Title,,0,0,0,,{\\fad(120,200)}${seg.title.toUpperCase()}`,
  ], 2.5);

  const source = path.join(here, 'out', seg.src, 'source.mp4');
  const file = path.join(outDir, `seg-${n}.mp4`);
  execFileSync('ffmpeg', ['-y', '-v', 'error',
    '-ss', String(seg.start), '-to', String(seg.end), '-i', source,
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black',
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', ...ENC, file]);
  parts.push(file);
  cursor += seg.end - seg.start;
});

// End card CTA
renderCard('card-end', [
  `Dialogue: 0,0:00:00.00,0:00:06.00,Title,,0,0,0,,{\\fad(150,300)}CURSOS GRATIS\\NCON CERTIFICADO`,
  `Dialogue: 0,0:00:00.40,0:00:06.00,Sub,,0,0,0,,biialab.org — el link está en la descripción`,
], 6);

// Concat
const listFile = path.join(outDir, 'concat.txt');
fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'));
const finalFile = path.join(outDir, `${cfg?.name ?? 'lo-mejor-de-jurgen-klaric'}.mp4`);
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
  '-c', 'copy', finalFile]);

// Chapters + description
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const chapterText = ['0:00 Introducción', ...chapters.map((c) => `${fmt(c.at)} ${c.title}`)].join('\n');
const description = `${cfg?.intro ?? 'Los 9 momentos más poderosos de Jürgen Klarić en BiiA LAB: neuroventas, mentalidad de abundancia y cómo venderle al cerebro.'}

🎓 Curso gratis completo con certificado: https://www.biialab.org/?utm_source=youtube&utm_medium=description&utm_campaign=compilation

⏱️ Capítulos:
${chapterText}

Conferencias completas:
${cfg?.sources ?? '· Cómo Vender Más: https://www.youtube.com/watch?v=K1A0ua1Xhok\n· Neuro Riqueza: https://www.youtube.com/watch?v=5_s7M859KCk'}

${cfg?.hashtags ?? '#neuroventas #jurgenklaric #ventas'}`;

fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify([{
  file: path.basename(finalFile),
  title: cfg?.title ?? 'Jürgen Klarić: los 9 momentos que te enseñan a vender | Lo mejor de BiiA LAB',
  description,
  style: 'compilation',
  sourceVideoId: 'compilation',
  start: 0, end: Math.round(cursor),
}], null, 2));

console.log(`Done: ${finalFile}`);
console.log(`Duration ~${fmt(cursor)} — chapters:\n${chapterText}`);
