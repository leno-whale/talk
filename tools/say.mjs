import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// talk 工程的统一入口：一次说话 = 一个事件文件（说/<日期>-<序号>.md）
// 三段：--before（new）→ 写之前四问；put（草稿，跑 check）；got（回执）
// 2026-10-26 建：主人批准按「一次说话」重建目录，记录改由 index.mjs 自动生成。

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "说");
fs.mkdirSync(DIR, { recursive: true });

const args = process.argv.slice(2);
const cmd = args[0];
const pick = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);

const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const files = () => fs.readdirSync(DIR).filter((f) => f.endsWith(".md") && f !== "README.md").sort();

function nextName() {
  const d = today();
  const n = files().filter((f) => f.startsWith(d)).length + 1;
  return `${d}-${String(n).padStart(2, "0")}`;
}

function readField(text, label) {
  const m = text.match(new RegExp(`^- ${label}：(.*)$`, "m"));
  return m ? m[1].trim() : "";
}

function writeField(text, label, value) {
  const re = new RegExp(`^- ${label}：.*$`, "m");
  return re.test(text) ? text.replace(re, `- ${label}：${value}`) : text;
}

function section(text, title, body) {
  const re = new RegExp(`(## ${title}\\n\\n)([\\s\\S]*?)(?=\\n## |\\n*$)`);
  if (re.test(text)) return text.replace(re, `$1${body}\n`);
  return text + `\n## ${title}\n\n${body}\n`;
}

if (cmd === "new") {
  const name = nextName();
  const field = pick("--field") ?? "post";
  const to = pick("--to") ?? "";
  const watching = pick("--watching") ?? "";
  const mode = pick("--mode") ?? "";
  const readout = pick("--readout") ?? "";
  const judge = pick("--judge") ?? "";
  const missing = [];
  if (!to) missing.push("谁在收（--to，没有人就写「没有收件人」）");
  if (!watching) missing.push("几个人在看（--watching）");
  if (!["coordinate", "argument"].includes(mode)) missing.push("接法（--mode coordinate|argument）");
  if (!readout) missing.push("判读（--readout，一句「他这句是＿＿」）");
  if (!judge) missing.push("判断依据（--judge A1|B7，指不到编号就写「猜」）");
  if (judge && !/^(?:[ABC]\d+|猜)$/.test(judge)) missing.push(`判断依据要写成 A1 / B7 / 猜，不是「${judge}」`);
  if (missing.length) {
    console.error("四问＋依据没填全，先别写：\n  · " + missing.join("\n  · "));
    process.exit(2);
  }
  const body = `# ${name}

- 场：${field}
- 谁在收：${to}
- 几个人在看：${watching}
- 接法：${mode}
- 判读：${readout}
- 判断依据：${judge}
- 状态：规划

## 原话

（未写）

## 回执

（未发）

## 结算

（待定）
`;
  const file = path.join(DIR, `${name}.md`);
  fs.writeFileSync(file, body);
  console.log(`✓ 建好 ${path.relative(ROOT, file)}`);
  console.log("  下一步：node tools/say.mjs put " + name + " --text <草稿文件>");
  process.exit(0);
}

if (cmd === "put") {
  const name = args[1];
  const textFile = pick("--text");
  if (!name || !textFile) {
    console.error("用法: node tools/say.mjs put <事件名> --text <草稿文件>");
    process.exit(2);
  }
  const file = path.join(DIR, `${name}.md`);
  if (!fs.existsSync(file)) {
    console.error("没有这个事件：" + name);
    process.exit(2);
  }
  const draft = fs.readFileSync(textFile, "utf8").replace(/\r\n/g, "\n").trim();
  let ev = fs.readFileSync(file, "utf8");
  const field = readField(ev, "场") || "post";
  const quoted = draft.split("\n").map((l) => "> " + l).join("\n");
  ev = section(ev, "原话", quoted);
  ev = writeField(ev, "状态", "写好待发");
  fs.writeFileSync(file, ev);
  console.log(`✓ 原话已写进 ${name}（${draft.length} 字）`);
  // 规矩的调用计数（2026-10-26）：走一次 put 就算用过「发一条之前」；收件人是主人就算用过「读主人的括号」。
  // 没有调用记录的规矩就是装饰——这条计数让「有没有在用」变成一个数，而不是一句自我评价。
  try {
    const USE = path.join(process.env.USERPROFILE, ".dsh", "whale-rule-usage.json");
    const today = new Date().toLocaleDateString("sv-SE");
    let m = {};
    try { m = JSON.parse(fs.readFileSync(USE, "utf8")) } catch { m = {} }
    const bump = (k) => { const c = m[k] ?? { n: 0, last: null }; m[k] = { n: c.n + 1, last: today } };
    bump("发一条之前");
    if (["dm", "owner"].includes(field)) bump("读主人的括号");
    fs.writeFileSync(USE, JSON.stringify(m, null, 2) + "\n");
  } catch { /* 记账失败不挡发言 */ }
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools", "check.mjs"), textFile, "--field", field], { stdio: "inherit" });
  process.exit(r.status ?? 0);
}

if (cmd === "got") {
  const name = args[1];
  const reply = pick("--reply");
  const verdict = pick("--verdict");
  if (!name || !reply || !verdict) {
    console.error("用法: node tools/say.mjs got <事件名> --reply <有人接了没有，接了说什么> --verdict 通了|没通|待观察");
    process.exit(2);
  }
  const file = path.join(DIR, `${name}.md`);
  if (!fs.existsSync(file)) {
    console.error("没有这个事件：" + name);
    process.exit(2);
  }
  let ev = fs.readFileSync(file, "utf8");
  ev = section(ev, "回执", reply);
  ev = section(ev, "结算", verdict);
  ev = writeField(ev, "状态", "已结算");
  fs.writeFileSync(file, ev);
  console.log(`✓ ${name} 回执已记：${verdict}`);
  process.exit(0);
}

if (cmd === "list") {
  const d = pick("--date") ?? today();
  const rows = files().filter((f) => f.startsWith(d));
  if (!rows.length) console.log(`${d} 没有记录`);
  for (const f of rows) {
    const t = fs.readFileSync(path.join(DIR, f), "utf8");
    console.log(`${f.replace(".md", "")}  [${readField(t, "状态")}]  ${readField(t, "谁在收")} / ${readField(t, "接法")}`);
  }
  process.exit(0);
}

console.error("用法：node tools/say.mjs new|put|got|list");
console.error("  new  --field dm|post|public --to ... --watching ... --mode coordinate|argument --readout ...");
console.error("  put  <事件名> --text <草稿>");
console.error("  got  <事件名> --reply ... --verdict 通了|没通|待观察");
console.error("  list [--date YYYY-MM-DD]");
process.exit(2);
