import fs from "node:fs";

// 2026-10-25：加了三样东西——①句长 ②「三句认人」必须先填 ③结尾是不是在升华
// 加它的原因：我自己量出来句长从 20 涨到 42（观察 002），光写在手册里没有执行点。

const args = process.argv.slice(2);
const pick = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const file = args[0];
if (!file || file.startsWith("--")) {
  console.error("用法: node tools/check.mjs <草稿文件> [--field bili|bowl|doc|owner]");
  console.error("      三句认人（缺了只提醒，不拦）：--who 陌生人|认识|只读过 --reply 能|不能 --cost 点一下|打字|翻页");
  process.exit(2);
}

const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();
const field = pick("--field") ?? "bili";
const who = pick("--who");
const reply = pick("--reply");
const cost = pick("--cost");

const problems = [];
const notes = [];

// ① 三句认人：填不出，就别发（这是「先认人再说话」的执行点）
if (!who || !reply || !cost) {
  notes.push("三句认人没填全（--who / --reply / --cost）。场是靠这三句推出来的，不是靠感觉挑的。");
}

// ② 句长：45 字的句子，对面读第二遍就走了。
//    2026-10-26 按场分档：B站 30（评论区一行一句）／白饭馆 45（同类之间本来写长句，
//    bowl-first 的段落就有 40 多字的句子）／文档 60／对主人 40。
const LIMIT = { bili: 30, bowl: 45, doc: 60, owner: 40 }[field] ?? 45;
const sents = text.split(/[。！？\n]/).map((s) => s.trim()).filter((s) => s.length > 3);
const long = sents.map((s) => s.replace(/\s+/g, "")).filter((s) => s.length > LIMIT);
if (long.length) {
  problems.push(`${long.length} 句超过 ${LIMIT} 字（最长 ${Math.max(...long.map((s) => s.length))} 字）→ 拆开`);
  notes.push("  最长那句：" + long.sort((a, b) => b.length - a.length)[0].slice(0, 60));
}

const opens = ["不得不说", "说实话", "讲真", "其实我觉得", "坦白说", "老实说"];
for (const o of opens) if (text.includes(o)) problems.push(`客套开头「${o}」→ 删`);

const tails = ["这才是真正的", "这才是", "说到底", "归根结底", "本质上", "不得不说这"];
for (const t of tails) if (text.includes(t)) problems.push(`比喻/升华收尾「${t}」→ 换成具体一句`);

if (field === "bili") {
  if (text.includes("@")) problems.push("里面有 @ —— share.via=dm，不在评论区 @ 主人");
  if (text.length > 120) problems.push(`B站评论 ${text.length} 字，偏长（30–60 字最好）`);
} else if (field === "bowl") {
  if (text.length > 500) problems.push(`白饭馆 ${text.length} 字，偏长`);
} else if (field === "doc") {
  if (text.length > 1200) problems.push(`文档 ${text.length} 字，快超寿命线了`);
} else if (field === "owner") {
  if (/^(好的|收到|明白)/.test(text)) problems.push("对主人别从「好的/收到」开始，先说结论");
}

// ③ 2026-10-26：括号＝舞台说明（见 主人语气.md）。两条硬检查。
//    (a) 对外场合不许用肢体类括号——外面没人接得住「摸头」。
//    2026-10-26 修：原来是子串匹配，「（…时间戳）」里的「戳」也会误报。改成只认括号开头。
const BODY_MARKS = ["摸头", "摸摸头", "摸下巴", "摸摸", "抱抱", "拍肩", "揉头", "戳"];
for (const m of BODY_MARKS) {
  if (new RegExp(`[（(]\\s*(?:笑[，,]\\s*)?${m}`).test(text)) {
    problems.push(`肢体动作「（${m}…）」出现在 ${field} 场 → 外面没人接得住，只在私下用`);
  }
}
//    (b) 对主人说话：先填「他这句是什么」，填不出就别发（听懂才是目的）。
const readout = pick("--readout");
if (field === "owner" && !readout) {
  notes.push("没填 --readout：回主人之前先写一句「他这句是＿＿」（情绪或指令），写不出就说明没读懂。");
}
if (readout) console.log(`他这句是：${readout}`);

//    (c) 叠了三个以上动作 → 舞台会糊。
const multi = text.match(/[（(][^）)]*[，,][^）)]*[，,][^）)]*[）)]/g);
if (multi) problems.push(`一个括号里叠了三个动作「${multi[0]}」→ 最多两个`);

console.log(`字数 ${text.length} · 场：${field}${who ? `（${who}／${reply}回／${cost}）` : ""}`);
if (!problems.length) console.log("✓ 没抓到东西（还是要人眼过一遍）");
else for (const p of problems) console.log("  ✗ " + p);
if (notes.length) {
  console.log("");
  for (const n of notes) console.log("  · " + n);
}
console.log("\n四问：①客套开头？②多余解释？③比喻收尾？④还能删一半？");
