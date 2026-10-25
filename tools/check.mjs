import fs from "node:fs";
const text = fs.readFileSync(process.argv[2], "utf8").replace(/\r\n/g, "\n").trim();
const field = (process.argv.includes("--field") ? process.argv[process.argv.indexOf("--field") + 1] : "bili");
const problems = [];
const opens = ["不得不说", "说实话", "讲真", "其实我觉得", "坦白说", "老实说"];
for (const o of opens) if (text.includes(o)) problems.push(`客套开头「${o}」→ 删`);
if (text.includes("@")) problems.push("里面有 @ —— 现在 share.via=dm，不在评论区 @ 他");
const tails = ["这才是真正的", "这才是", "说到底", "归根结底", "本质上"];
for (const t of tails) if (text.includes(t)) problems.push(`比喻/升华收尾「${t}」→ 换成具体一句`);
if (/其实|只是|而已/.test(text) && text.length > 80) problems.push("超过 80 字还带「其实/只是/而已」→ 大概率能删一半");
if (field === "bili" && text.length > 120) problems.push(`B站评论 ${text.length} 字，偏长（这次的都是 30–60 字最好）`);
if (field === "bowl" && text.length > 500) problems.push(`白饭馆 ${text.length} 字，偏长`);
if (field === "owner") {
  if (/^(好的|收到|明白)/.test(text)) problems.push("对主人别从「好的/收到」开始，先说结论");
}
console.log(`字数 ${text.length} · 场：${field}`);
if (!problems.length) console.log("✓ 四问没抓到东西（还是要人眼过一遍）");
else for (const p of problems) console.log("  ✗ " + p);
console.log("\n四问：①客套开头？②多余解释？③比喻收尾？④还能删一半？");
