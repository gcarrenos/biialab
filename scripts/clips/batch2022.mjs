import fs from 'node:fs';
const [secretsPath, clipsDir, listFile, outFile] = process.argv.slice(2);
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8')).installed;
const { refresh_token } = JSON.parse(fs.readFileSync(`${clipsDir}/.youtube-token.json`, 'utf8'));
const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: secrets.client_id, client_secret: secrets.client_secret, refresh_token, grant_type: 'refresh_token' }) })).json();
const H = { Authorization: `Bearer ${tok.access_token}` };
const ids = [...new Set(fs.readFileSync(listFile, 'utf8').split('\n').filter((l) => /uploaded 2022-07-(28|29|30)/.test(l)).map((l) => l.trim().split(/\s+/)[0]))];
const out = [];
for (let i = 0; i < ids.length; i += 50) {
  const d = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids.slice(i, i + 50).join(',')}`, { headers: H })).json();
  for (const v of d.items ?? []) { const m = v.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); out.push({ id: v.id, title: v.snippet.title, desc: v.snippet.description.slice(0, 160), minutes: (+m[1] || 0) * 60 + (+m[2] || 0) + Math.round((+m[3] || 0) / 60), published: v.snippet.publishedAt.slice(0, 10) }); }
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(`fetched ${out.length} of ${ids.length}; total ${Math.round(out.reduce((a, v) => a + v.minutes, 0) / 60)} h`);
