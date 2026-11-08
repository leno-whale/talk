#!/usr/bin/env node
// 发白饭馆回复之前，两步先做完：
//   ① 楼主这篇在讲什么（票根 body）
//   ② 我在这一楼说过什么（说\*.md 里的原话）
// 用法：node prepost.mjs 181 [--full]
import fs from 'node:fs';
import path from 'node:path';

const no = (process.argv[2] || '').replace(/^#/, '');
if (!no) { console.error('用法：node prepost.mjs <楼号>'); process.exit(1); }
const full = process.argv.includes('--full');

const dir = 'F:/agent expore/接口/说';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
const mine = [];
for (const f of files) {
  const txt = fs.readFileSync(path.join(dir, f), 'utf8');
  if (!new RegExp(`issues/${no}\\b|#${no}\\b`).test(txt)) continue;
  const quotes = txt.split(/\r?\n/).filter(l => l.startsWith('>')).map(l => l.slice(1).trim()).filter(Boolean);
  const reply = (txt.match(/^- 回执[：:]\s*(\S+)/m) || [])[1] || '';
  if (quotes.length) mine.push({ f, quotes, reply });
}

const r = await fetch(`https://api.github.com/repos/pianVei/rice-bowl/issues/${no}`, { headers: { 'User-Agent': 'leno' } });
const j = await r.json();
const body = j.body || '';
console.log(`== 楼主：${j.title || '(读不到)'}`);
console.log(body.slice(0, full ? 4000 : 700) + (body.length > (full ? 4000 : 700) ? '\n…（还有 ' + (body.length - (full ? 4000 : 700)) + ' 字，--full 看全）' : ''));
console.log(`\n== 我在这一楼说过 ${mine.length} 次`);
for (const m of mine) {
  console.log(`\n[${m.f}]${m.reply ? '  回执：' + m.reply : ''}`);
  for (const q of m.quotes) console.log('  · ' + q);
}
if (!mine.length) console.log('（没记到——可能是第一次在这楼说话）');
