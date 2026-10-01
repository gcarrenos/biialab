// Composes catalog thumbnails: real frame (YouTube's own auto-thumbnail) + headline in brand type.
// Nothing generated — only the speaker's actual frame, a gradient and text.
//   node wave1/thumb.mjs            → wave1/thumbs/<id>.jpg for every entry in SPECS
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const FONT = path.join(here, '..', 'fonts', 'Anton-Regular.ttf');
const MARK = path.resolve(here, '../../../public/email/logo-mark-dark.png');
const W = 1280, H = 720, ORANGE = '#ff4d14';

// lines: headline lines bottom-up; hot: index of the orange line; crop: [left,top,width,height] on the source frame
const SPECS = {
  uUUVe3dDRVg: { lines: ['ASÍ DECIDE', 'EL CEREBRO', 'ANTES DE COMPRAR'], hot: 1, crop: [0, 60, 640, 360] },
  f_92WkGUSaY: { lines: ['VÉNDALE', 'A LA MENTE,', 'NO A LA GENTE'], hot: 0 },
  'pnICAzY9-Sw': { lines: ['10 CLAVES', 'DE UNA MENTE', 'EMPRENDEDORA'], hot: 0 },
  szNgp8wX62w: { lines: ['CÓMO CONSEGUIR', 'INVERSIONISTAS', 'SIN REGALAR TU EMPRESA'], hot: 1, crop: [180, 40, 800, 450] },
  '2OXnA1M4E7I': { lines: ['LIDERAZGO', 'EMOCIONAL', 'PARTE 2'], hot: 1, crop: [100, 0, 960, 540] },
  Rn4a6A6F3l0: { lines: ['CÓMO ARMAR', 'UN DISCURSO', 'DE NEUROVENTAS'], hot: 2 },
};

const gradient = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></linearGradient>
    <linearGradient id="l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.55" stop-color="#000" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#l)"/><rect width="${W}" height="${H}" fill="url(#b)"/>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="${ORANGE}"/>
</svg>`);

for (const [id, s] of Object.entries(SPECS)) {
  const src = path.join(here, 'thumbs', `${id}.src.jpg`);
  let img = sharp(src);
  if (s.crop) img = img.extract({ left: s.crop[0], top: s.crop[1], width: s.crop[2], height: s.crop[3] });
  const base = path.join(here, 'thumbs', `${id}.base.png`);
  await img.resize(W, H, { fit: 'cover', position: 'attention' }).sharpen()
    .composite([{ input: gradient }, { input: await sharp(MARK).resize(56).toBuffer(), left: 48, top: 48 }])
    .png().toFile(base);
  // headline: bottom-anchored, biggest line size that fits 62% of the width
  const size = s.lines.some((l) => l.length > 15) ? 78 : 96, lh = Math.round(size * 1.14);
  const filters = s.lines.map((line, i) => {
    const y = H - 44 - (s.lines.length - i) * lh;
    const color = i === s.hot ? ORANGE : 'white';
    const txt = line.replace(/'/g, "\\'").replace(/,/g, '\\,').replace(/:/g, '\\:');
    return `drawtext=fontfile='${FONT}':text='${txt}':fontsize=${size}:fontcolor=${color}:x=52:y=${y}:shadowcolor=black@0.6:shadowx=3:shadowy=3`;
  }).join(',');
  const out = path.join(here, 'thumbs', `${id}.jpg`);
  execFileSync('ffmpeg', ['-v', 'error', '-i', base, '-vf', filters, '-frames:v', '1', '-q:v', '3', '-y', out]);
  fs.unlinkSync(base);
  console.log(id, Math.round(fs.statSync(out).size / 1024) + 'KB');
}
