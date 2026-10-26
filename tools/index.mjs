import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 从 说/ 里的事件文件生成索引：读册首＝读全册（数放最上面）
// 2026-10-26 建。手不写索引，跑这个命令。

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "说");
const OUT = path.join(ROOT, "记录-索引.md");

const fld = (t, k) => (t.match(new RegExp(`^- ${k}：(.*)$`, "m")) || [, ""])[1].trim();
const sec = (t, k) => (t.match(new RegExp(`## ${k}\\n\\n([\\s\\S]*?)(?=\\n## |\\n*$)`)) || [, ""])[1].trim();

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}-\d{2}\.md$/.test(f)).sort() : [];
const rows = files.map((f) => {
  const t = fs.readFileSync(path.join(DIR, f), "utf8");
  return {
    name: f.replace(".md", ""),
    date: f.slice(0, 10),
    field: fld(t, "场"),
    to: fld(t, "谁在收"),
    mode: fld(t, "接法"),
    state: fld(t, "状态"),
    verdict: sec(t, "结算").replace(/\n/g, " ").slice(0, 40),
    reply: sec(t, "回执").replace(/\n/g, " ").slice(0, 40),
    said: sec(t, "原话").replace(/^> ?/gm, "").replace(/\n/g, " ").slice(0, 40),
  };
});

const count = (re) => rows.filter((r) => re.test(r.verdict)).length;
const done = rows.filter((r) => r.state === "已结算").length;
const head = [
  "# 记录索引（自动生成，别手改）",
  "",
  `生成时间：${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
  "",
  `- 事件总数：**${rows.length}**（已结算 ${done}，未结算 ${rows.length - done}）`,
  `- 通了：**${count(/^通了/)}** · 没通：**${count(/^没通/)}** · 待观察/待定：**${rows.length - count(/^通了/) - count(/^没通/) - (rows.length - done)}**＋未结算`,
  `- 按场：dm ${rows.filter((r) => r.field === "dm").length} · post ${rows.filter((r) => r.field === "post").length} · public ${rows.filter((r) => r.field === "public").length}`,
  "",
  "| 日期 | 序号 | 场 | 谁在收 | 接法 | 状态 | 我说了什么（摘要） | 有人接吗 | 结算 |",
  "|---|---|---|---|---|---|---|---|---|",
];
const lines = rows.map(
  (r) => `| ${r.date} | ${r.name.slice(11)} | ${r.field} | ${r.to} | ${r.mode} | ${r.state} | ${r.said} | ${r.reply} | ${r.verdict} |`
);

fs.writeFileSync(OUT, [...head, ...lines, ""].join("\n"));
console.log(`✓ ${path.basename(OUT)}：${rows.length} 条（通 ${count(/^通了/)} / 没通 ${count(/^没通/)}）`);
