// ===== gesture.js - L3 direction-gesture decoder (center-out grammar) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Layer: L3 decoder | Consumers: InkPad stroke readouts (right / Z / X /
//        circle grammar) | Spec: docs/UI-FRAMEWORK.md Sec.6.3
// Data flow: stroke pts -> bbox normalize (aspect-stretched) -> 8-direction
// segment sequence (+ total turn for circle) -> tiny dictionary match via
// subsequence edit distance. Pure and DOM-free, node-testable.
// ===== L3 · 方向手势解码器(§6.3,center-out 文法) =====
// 把笔画轨迹段重采样为 8 方向序列,匹配小词典:右→刷新态、Z→撤销/返回、
// 圈→环绕预览、叉→dismiss。只认「落笔态」手势(调用方为 InkPad 的 stroke,
// 天然 pen-down;双模型律:提笔态永不误触发)。
// 8 方向序号:0=E 1=SE 2=S 3=SW 4=W 5=NW 6=N 7=NE

// 输入 InkPad stroke {pts:[{x,y}]}(原始像素坐标亦可);输出 {name, conf} | null
export function recognize(stroke) {
  const raw = stroke?.pts
  if (!raw || raw.length < 6) return null
  // 先按自身 bbox 拉伸归一:方向量化须摆脱像素横纵比
  // (宽 pad 上画 Z,对角线在像素空间近水平,会被量化成 W)
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9
  for (const p of raw) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  const w = maxX - minX || 1e-6, h = maxY - minY || 1e-6
  const pts = raw.map(p => ({ x: (p.x - minX) / w, y: (p.y - minY) / h }))
  const seq = dirSequence(pts)
  if (!seq.length) return null

  // 圈:累计转角 ≥ 300°(顺/逆皆可)
  const turn = totalTurn(pts)
  if (Math.abs(turn) >= (Math.PI * 5) / 3) return { name: 'circle', conf: Math.min(1, Math.abs(turn) / (Math.PI * 2)) }

  // 词典匹配:编辑代价 ≤1 且总成本(代价+长度差惩罚)最小者胜——
  // 否则短词典「右」会以子序列身份抢走「Z」([0,3,0] 含 [0])
  const DICT = [
    // right: a single East segment
    { name: 'right', seq: [0] },
    // z: E, SW, E - top bar, backslash diagonal, bottom bar
    { name: 'z', seq: [0, 3, 0] },
    // x: two crossing diagonals, accepted in either drawing orientation
    // ([SE, SW] or [NE, S])
    { name: 'x', seq: [1, 3] },
    { name: 'x', seq: [7, 2] },
  ]
  let best = null
  for (const d of DICT) {
    const dist = subseqEdit(seq, d.seq)
    if (dist > 1) continue
    const cost = dist + Math.abs(seq.length - d.seq.length) * 0.1
    if (!best || cost < best.cost) best = { name: d.name, cost, dist }
  }
  // Confidence decays with edit distance but floors at 0.5 for accepted matches.
  if (best) return { name: best.name, conf: Math.max(0.5, 1 - best.dist * 0.35) }
  return null
}

// 点列 → 合并后的 8 方向段序列(短段并入累计)
function dirSequence(pts) {
  const MIN = 0.06 // 归一距离下的最短有效段
  const out = []
  let acc = 0, accDir = null
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y
    const d = Math.hypot(dx, dy)
    if (d < 0.004) continue // 抖动
    // Quantize the segment bearing to the nearest 45-degree bucket (mod 8
    // wraps negative rounding).
    const dir = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8
    if (dir === accDir) acc += d
    else {
      if (accDir !== null && acc >= MIN) out.push(accDir)
      else if (accDir !== null && out.length && acc < MIN) { /* 碎段丢弃 */ }
      accDir = dir
      acc = d
    }
  }
  if (accDir !== null && acc >= MIN) out.push(accDir)
  return out
}

// 累计转角(弧度,带符号;圈检测用)
function totalTurn(pts) {
  let turn = 0
  let prev = null
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y
    if (Math.hypot(dx, dy) < 0.006) continue
    const a = Math.atan2(dy, dx)
    if (prev !== null) {
      let d = a - prev
      while (d > Math.PI) d -= Math.PI * 2
      while (d < -Math.PI) d += Math.PI * 2
      turn += d
    }
    prev = a
  }
  return turn
}

// seq 是否「包含」pattern(子序列);返回编辑代价 0/1/2。
// 单元素词典必须精确包含(否则「跳过唯一元素」会让任何笔画都命中)
function subseqEdit(seq, pattern) {
  let j = 0
  for (const s of seq) if (s === pattern[j]) j++
  if (j >= pattern.length) return 0
  if (pattern.length < 2) return 2
  // 允许一次插入/替换/删除的宽松匹配(短词典够用);仅当序列本身 ≥2 段——
  // 否则一根纯竖线会以「x 删一笔」的身份误命中
  for (let skip = 0; skip < pattern.length; skip++) {
    const pp = pattern.filter((_, k) => k !== skip)
    let jj = 0
    for (const s of seq) if (s === pp[jj]) jj++
    if (jj >= pp.length && seq.length >= 2) return 1
  }
  return 2
}
