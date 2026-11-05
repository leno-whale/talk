#!/usr/bin/env node
/**
 * 2026-11-05 转发壳：真正的 gh-say.mjs 在 C:\Users\HUAWEI\.dsh\whale-work\gh-say.mjs。
 *
 * 为什么有这个文件：主人（和我）两次跑到 接口\tools\gh-say.mjs 扑空——
 * 命令路径不存在时 node 直接 ENOENT，活没干成；而 say.mjs 又只在 接口\tools。
 * 两个 say 分居两处，靠记性就是会走错。这个壳只做转交，参数原样透传。
 *
 * 用法（与真身一致）：
 *   node 接口\tools\gh-say.mjs <issue号|new> <正文文件> [--title 标题文件] [--owner] [--unlimited]
 */
import 'file:///C:/Users/HUAWEI/.dsh/whale-work/gh-say.mjs';
