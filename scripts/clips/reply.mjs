#!/usr/bin/env node
// Comment reply assistant for the channel's Shorts (and any video ids given).
// Pulls new top-level comments, triages them, drafts a warm Spanish reply per
// comment in the BiiA LAB voice, then asks you to approve/skip/edit each one
// before posting through the channel's OAuth token.
//
//   FINDCLIX_API_KEY=... YOUTUBE_API_KEY=... node scripts/clips/reply.mjs \
//     --client-secrets <oauth.json> [--videos id1,id2] [--auto] [--max 30]
//
// --auto posts LOW-RISK replies (thanks/praise) without asking; questions and
// anything sensitive always queue for approval. Replied comment ids are kept in
// replied.json so nothing gets answered twice.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';

const argv = process.argv.slice(2);
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const AUTO = argv.includes('--auto');
const MAX = Number(flag('--max')) || 30;
const KEY = process.env.YOUTUBE_API_KEY;
const AI = process.env.FINDCLIX_API_KEY;
const secretsPath = flag('--client-secrets');
if (!KEY || !AI || !secretsPath) {
  console.error('Need YOUTUBE_API_KEY, FINDCLIX_API_KEY and --client-secrets.');
  process.exit(1);
}

const here = import.meta.dirname;
const repliedFile = path.join(here, 'replied.json');
const replied = new Set(fs.existsSync(repliedFile) ? JSON.parse(fs.readFileSync(repliedFile, 'utf8')) : []);
const ledger = JSON.parse(fs.readFileSync(path.join(here, 'ledger.json'), 'utf8'));
const videoIds = flag('--videos')?.split(',') ?? ledger.uploads.map((u) => u.youtubeId);
const titleOf = new Map(ledger.uploads.map((u) => [u.youtubeId, u.title]));

// ------------------------------------------------------------- collect
const candidates = [];
for (const vid of videoIds) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${vid}&order=time&maxResults=25&key=${KEY}`);
  const data = await res.json();
  if (!res.ok) continue; // private/scheduled videos have no public comments
  for (const item of data.items ?? []) {
    const c = item.snippet.topLevelComment.snippet;
    const id = item.snippet.topLevelComment.id;
    if (replied.has(id)) continue;
    if (item.snippet.totalReplyCount > 0 && c.authorChannelId?.value) {
      // if the channel owner already replied YouTube marks nothing here; we
      // rely on replied.json — but skip threads that already have replies from anyone
      // only when running --auto, to be conservative
      if (AUTO) continue;
    }
    candidates.push({
      id, videoId: vid, videoTitle: titleOf.get(vid) ?? vid,
      author: c.authorDisplayName,
      text: c.textDisplay.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      likes: c.likeCount, published: c.publishedAt,
    });
  }
}
candidates.sort((a, b) => new Date(b.published) - new Date(a.published));
const batch = candidates.slice(0, MAX);
if (batch.length === 0) { console.log('No new comments.'); process.exit(0); }
console.log(`${batch.length} new comments to consider.\n`);

// --------------------------------------------------------------- draft
async function draft(c) {
  const res = await fetch('https://ai.findclix.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${AI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: '@openai/gpt-oss-120b',
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content:
            'Eres quien responde comentarios en el canal de YouTube de BiiA LAB (Jürgen Klarić, 2M ' +
            'suscriptores). Hablas como una persona real del equipo, no como una empresa: cercano, ' +
            'con energía, tuteando, español latino neutro. 1-2 frases, específicas al comentario. ' +
            'Prohibido empezar con "Entendemos", "Gracias por tu comentario" o frases de plantilla. ' +
            'Máximo un emoji, y solo si suma. ' +
            'DATOS REALES (úsalos solo si preguntan): todos los cursos en biialab.org son GRATIS; al ' +
            'aprobar el examen final se emite un certificado verificable, y activarlo para descargar el ' +
            'PDF y añadirlo a LinkedIn tiene un costo pequeño (USD 19). Hay un Diplomado en Neuroventas ' +
            'en preventa en biialab.org/diplomado. Nunca inventes precios ni promesas. ' +
            'Nunca des consejo médico, legal ni financiero personal; ante temas de salud o duelo, ' +
            'responde con calidez humana (agradece la confianza, desea lo mejor) sin opinar sobre el tema. ' +
            'Ejemplos del tono correcto: "Qué duro leer eso, Karen — y qué cierto: de los golpes más ' +
            'feos salen las lecciones más grandes." / "¡Hola Alex! Bienvenido, ojalá te sirva." ' +
            'Responde SOLO JSON: {"risk":"low"|"question"|"sensitive"|"spam","reply":str|null}. ' +
            'spam = links, promos, insultos (reply null); sensitive = salud, duelo, crisis, depresión; ' +
            'question = preguntan algo concreto; low = agradecimientos, elogios, reflexiones.',
        },
        {
          role: 'user',
          content: `Video: "${c.videoTitle}"\nComentario de ${c.author}: "${c.text}"\n\nRedacta la respuesta.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const data = await res.json();
  const msg = data.choices?.[0]?.message ?? {};
  const text = (msg.content ?? msg.reasoning_content ?? msg.reasoning ?? '').replace(/```json|```/g, '');
  try {
    return JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  } catch {
    return { risk: 'question', reply: null };
  }
}

// ---------------------------------------------------------------- post
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8')).installed;
const { refresh_token } = JSON.parse(fs.readFileSync(path.join(here, '.youtube-token.json'), 'utf8'));
const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: secrets.client_id, client_secret: secrets.client_secret, refresh_token, grant_type: 'refresh_token' }),
})).json();

async function post(parentId, text) {
  const res = await fetch('https://www.googleapis.com/youtube/v3/comments?part=snippet', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ snippet: { parentId, textOriginal: text } }),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 200));
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let posted = 0, skipped = 0;
for (const c of batch) {
  const d = await draft(c);
  console.log(`\n─── ${c.videoTitle.slice(0, 50)}\n${c.author} (${c.likes}👍): ${c.text.slice(0, 220)}`);
  if (d.risk === 'spam' || !d.reply) { console.log('   ⏭  skipped (spam/no reply)'); replied.add(c.id); skipped++; continue; }
  console.log(`   [${d.risk}] → ${d.reply}`);

  let final = d.reply;
  if (AUTO && d.risk === 'low') {
    console.log('   ✓ auto-posting (low risk)');
  } else {
    const ans = (await rl.question('   post? [y]es / [n]o / [e]dit: ')).trim().toLowerCase();
    if (ans === 'n' || ans === '') { skipped++; continue; }
    if (ans === 'e') final = (await rl.question('   your reply: ')).trim() || final;
  }
  try {
    await post(c.id, final);
    replied.add(c.id);
    posted++;
    console.log('   ✓ posted');
  } catch (error) {
    console.log(`   ✗ failed: ${error.message}`);
  }
  fs.writeFileSync(repliedFile, JSON.stringify([...replied], null, 1));
}
rl.close();
console.log(`\nDone: ${posted} posted, ${skipped} skipped.`);
