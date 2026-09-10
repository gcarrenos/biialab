// List a course's lessons (by title substring across the 2022 batch) and download their Spanish captions to <outdir>/<id>.txt
import fs from 'node:fs';
const [secretsPath, clipsDir, batchJson, needle, outDir] = process.argv.slice(2);
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8')).installed;
const { refresh_token } = JSON.parse(fs.readFileSync(`${clipsDir}/.youtube-token.json`, 'utf8'));
const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: secrets.client_id, client_secret: secrets.client_secret, refresh_token, grant_type: 'refresh_token' }) })).json();
const H = { Authorization: `Bearer ${tok.access_token}` };
const all = JSON.parse(fs.readFileSync(batchJson, 'utf8'));
const rx = new RegExp(needle.replace(/\s+/g, '\\s*'), 'i');
const lessons = all.filter((v) => rx.test(v.title.replace(/\s+/g, ' ')));
const num = (t) => { const m = t.match(/^\s*(\d+)/) || t.match(/(\d+)\s*$/); return m ? +m[1] : 999; };
lessons.sort((a, b) => num(a.title) - num(b.title) || a.title.localeCompare(b.title));
fs.mkdirSync(outDir, { recursive: true });
console.log(`${lessons.length} lessons matching /${needle}/ (${Math.round(lessons.reduce((a, v) => a + v.minutes, 0))} min)`);
for (const v of lessons) {
  const out = `${outDir}/${v.id}.txt`;
  let words = 0;
  if (!fs.existsSync(out)) {
    const list = await (await fetch(`https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${v.id}`, { headers: H })).json();
    const track = (list.items ?? []).find((t) => t.snippet.language.startsWith('es')) ?? (list.items ?? [])[0];
    if (track) {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/captions/${track.id}?tfmt=srt`, { headers: H });
      if (r.ok) { const srt = await r.text(); const text = srt.replace(/\d+\r?\n\d\d:\d\d:\d\d,\d+ --> .*\r?\n/g, '').replace(/\r?\n\r?\n/g, ' ').replace(/\s+/g, ' ').trim(); fs.writeFileSync(out, text); }
      else fs.writeFileSync(out, `[caption download failed ${r.status}]`);
    } else fs.writeFileSync(out, '[no captions]');
  }
  words = fs.readFileSync(out, 'utf8').split(/\s+/).length;
  console.log(`  ${v.id}  ${String(v.minutes).padStart(3)}m  ${String(words).padStart(6)}w  ${v.title}`);
}
fs.writeFileSync(`${outDir}/lessons.json`, JSON.stringify(lessons, null, 1));
