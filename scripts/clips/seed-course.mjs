// Seed one course + its exam on biialab.org from a course.json ({course, exam}).
//   node seed-course.mjs <course.json> <thumbnailUrl> [--dry]
import fs from 'node:fs';
const [file, thumbnail, ...rest] = process.argv.slice(2);
const DRY = rest.includes('--dry');
const env = Object.fromEntries(fs.readFileSync('' + new URL('../../.env.local', import.meta.url).pathname + '', 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const password = env.ADMIN_PASSWORD;
if (!password) { console.error('ADMIN_PASSWORD missing in .env.local'); process.exit(1); }
const { course, exam } = JSON.parse(fs.readFileSync(file, 'utf8'));
const slugify = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const slug = slugify(course.title);
const payload = { password, courses: [{ ...course, thumbnail }] };
console.log(`course "${course.title}" → slug ${slug}, ${course.lessons.length} lessons; exam ${exam.questions.length} questions`);
if (DRY) { console.log(JSON.stringify(payload.courses[0], null, 1).slice(0, 1200)); process.exit(0); }
const post = async (path, body) => { const r = await fetch(`https://www.biialab.org${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const t = await r.text(); console.log(`${path} → ${r.status} ${t.slice(0, 600)}`); return r.ok; };
if (await post('/api/admin/seed-courses', payload)) await post('/api/admin/seed-exams', { password, exams: [{ ...exam, courseSlug: slug }] });
console.log(`\nlive: https://www.biialab.org/courses/${slug}`);
