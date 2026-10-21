// ===== dtw.js - L3 handwriting decoder (lite tier): banded DTW over inline templates =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Layer: L3 decoder | Consumers: InkPad readouts (decode / alphabet /
//        rawTemplates for Choreo replay) | Spec: docs/UI-FRAMEWORK.md Sec.6.2
// Data flow: stroke points -> 48-point arc-length resample -> bbox normalize
// (aspect-preserving) -> banded O(n^2) DTW against every template -> best char
// with exp-mapped confidence + alignment pairs + top-6 neighborhood.
// Pure and DOM-free: identical code path under browser and node unit tests;
// templates go through the same resample/normalize pipeline as user input.
// ===== L3 · 手写解码器 dtw.js lite 档(§6.2) =====
// 零依赖:内联 0–1 归一模板(zh:一/十/人/大/山/王/回/日/田/心;en:I/T/L/O/V/H/X),
// 48 点等弧长重采样 + 经典 O(n²) DTW(Sakoe-Chiba 带约束 |i-j|≤12 防 pathological warp)。
// 输出 {char, conf, warping(对齐点对,图 5b 绿色对应线数据), top6(邻域,供 Galaxy)}。
// real 档(Zenodo 10.5281/zenodo.18399428 预处理)列为采用期任务,非本档职责。
// 措辞规范(§9):lite 档为玩具精度,演示用。本模块不依赖浏览器,可直接 node 单测。

const N = 48
const BAND = 12

// 模板:多笔画折线(单位框,y 向下,按笔顺)
const TEMPLATES = {
  zh: {
    '一': [[[0.08, 0.5], [0.92, 0.5]]],
    '十': [[[0.5, 0.12], [0.5, 0.88]], [[0.08, 0.5], [0.92, 0.5]]],
    '人': [[[0.15, 0.18], [0.5, 0.88]], [[0.42, 0.55], [0.88, 0.2]]],
    '大': [[[0.08, 0.42], [0.92, 0.42]], [[0.5, 0.08], [0.42, 0.92]], [[0.46, 0.55], [0.9, 0.88]]],
    '山': [[[0.15, 0.2], [0.15, 0.82]], [[0.5, 0.08], [0.5, 0.82]], [[0.85, 0.2], [0.85, 0.82]], [[0.08, 0.82], [0.92, 0.82]]],
    '王': [[[0.1, 0.15], [0.9, 0.15]], [[0.1, 0.5], [0.9, 0.5]], [[0.1, 0.85], [0.9, 0.85]], [[0.5, 0.08], [0.5, 0.92]]],
    '回': [[[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9], [0.1, 0.1]], [[0.32, 0.32], [0.68, 0.32], [0.68, 0.68], [0.32, 0.68], [0.32, 0.32]]],
    '日': [[[0.25, 0.08], [0.75, 0.08], [0.75, 0.92], [0.25, 0.92], [0.25, 0.08]], [[0.25, 0.5], [0.75, 0.5]]],
    '田': [[[0.12, 0.1], [0.88, 0.1], [0.88, 0.9], [0.12, 0.9], [0.12, 0.1]], [[0.12, 0.5], [0.88, 0.5]], [[0.5, 0.1], [0.5, 0.9]]],
    '心': [[[0.18, 0.38], [0.24, 0.66]], [[0.12, 0.42], [0.45, 0.85], [0.82, 0.62], [0.78, 0.4], [0.6, 0.42]], [[0.52, 0.5], [0.56, 0.3]], [[0.7, 0.52], [0.75, 0.32]]],
  },
  en: {
    'I': [[[0.5, 0.1], [0.5, 0.9]]],
    'T': [[[0.1, 0.15], [0.9, 0.15]], [[0.5, 0.15], [0.5, 0.9]]],
    'L': [[[0.3, 0.1], [0.3, 0.9], [0.85, 0.9]]],
    'O': [[[0.5, 0.08], [0.82, 0.34], [0.82, 0.7], [0.5, 0.94], [0.18, 0.7], [0.18, 0.34], [0.5, 0.08]]],
    'V': [[[0.15, 0.1], [0.5, 0.9], [0.85, 0.1]]],
    'H': [[[0.2, 0.1], [0.2, 0.9]], [[0.8, 0.1], [0.8, 0.9]], [[0.2, 0.5], [0.8, 0.5]]],
    'X': [[[0.15, 0.1], [0.85, 0.9]], [[0.85, 0.1], [0.15, 0.9]]],
  },
}

// ---- 预处理:折线 → 按总弧长等分 48 点 → bbox 拉伸归一(模板与输入同管线) ----
function resample(strokes) {
  const segs = []
  let total = 0
  for (const st of strokes) {
    for (let i = 1; i < st.length; i++) {
      const d = Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1])
      segs.push({ a: st[i - 1], b: st[i], d })
      total += d
    }
  }
  if (total <= 0) return null
  const step = total / (N - 1)
  const pts = []
  let iSeg = 0, consumed = 0 // consumed:iSeg 段起点之前已消费的累计弧长
  for (let k = 0; k < N; k++) {
    const target = Math.min(total - 1e-9, k * step)
    while (iSeg < segs.length - 1 && consumed + segs[iSeg].d < target) {
      consumed += segs[iSeg].d
      iSeg++
    }
    const s = segs[iSeg]
    const u = s.d > 0 ? Math.max(0, Math.min(1, (target - consumed) / s.d)) : 0
    pts.push([s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u])
  }
  // bbox 归一:保纵横比 + 居中(不拉伸——2026-10-06 单测教训:拉伸会把微斜的
  // 单横「一」放大成整框对角线,误判为「大」;保比例后平线仍是平线)
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9
  for (const p of pts) {
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0])
    minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1])
  }
  const s = 1 / Math.max(maxX - minX, maxY - minY, 1e-6)
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  return pts.map(p => [0.5 + (p[0] - cx) * s, 0.5 + (p[1] - cy) * s])
}

// 预处理全部模板(模块加载一次)
const TPL_CACHE = {}
for (const lang of ['zh', 'en']) {
  TPL_CACHE[lang] = Object.entries(TEMPLATES[lang])
    .map(([char, strokes]) => ({ char, pts: resample(strokes) }))
    .filter(t => t.pts)
}

// ---- DTW(Sakoe-Chiba 带约束)----
// D = cost matrix (row-major, stride W = N+1), P = backpointers for path
// reconstruction (0 diagonal, 1 advance i, 2 advance j). Cells outside the
// band stay INF, so they can never enter an optimal path.
function dtw(a, b) {
  const W = N + 1
  const INF = 1e9
  const D = new Float64Array(W * W).fill(INF)
  const P = new Int8Array(W * W).fill(-1)
  D[0] = 0
  // Only |i-j| <= BAND is reachable: the band keeps worst-case warp bounded
  // (no pathological one-to-many stretches) and shrinks the constant of the
  // O(n^2) fill.
  for (let i = 1; i <= N; i++) {
    const lo = Math.max(1, i - BAND), hi = Math.min(N, i + BAND)
    for (let j = lo; j <= hi; j++) {
      const c = (a[i - 1][0] - b[j - 1][0]) ** 2 + (a[i - 1][1] - b[j - 1][1]) ** 2
      let best = D[(i - 1) * W + (j - 1)], dir = 0 // ↘
      const up = D[(i - 1) * W + j]
      if (up < best) { best = up; dir = 1 } // ↑
      const left = D[i * W + (j - 1)]
      if (left < best) { best = left; dir = 2 } // ←
      D[i * W + j] = best + c
      P[i * W + j] = dir
    }
  }
  // Walk the backpointers from (N,N) back to the origin, then reverse, to
  // recover the alignment point pairs (user index, template index).
  const path = []
  let i = N, j = N
  while (i > 0 && j > 0) {
    path.push([i - 1, j - 1])
    const dir = P[i * W + j]
    if (dir === 0) { i--; j-- }
    else if (dir === 1) i--
    else j--
  }
  path.reverse()
  // Path cost divided by N -> mean per-point cost, comparable across inputs.
  return { cost: D[N * W + N] / N, path }
}

// ---- 解码入口 ----
// input: InkPad stroke {pts:[{x,y}]} 或折线数组;lang:'zh'|'en'
export function decode(lang, input) {
  const strokes = Array.isArray(input?.pts)
    ? [input.pts.map(p => [p.x, p.y])]
    : (Array.isArray(input?.[0]?.[0]) ? input : null)
  if (!strokes) return null
  const cache = TPL_CACHE[lang] || TPL_CACHE.zh
  const user = resample(strokes)
  if (!user) return null
  // Score the input against every cached template, keeping each alignment path.
  const scored = cache.map(t => {
    const { cost, path } = dtw(user, t.pts)
    return { char: t.char, d: cost, path }
  })
  // Ascending DTW cost: index 0 is the decode, slice(0,6) feeds the Galaxy
  // neighborhood UI.
  scored.sort((a, b) => a.d - b.d)
  const best = scored[0]
  const tpl = cache.find(t => t.char === best.char)
  // conf:exp 映射。2026-10-06 实测标定(node 单测):同字异写 d≈0.01–0.06 → conf
  // 0.49–0.93;异字 d≥0.09 → conf≤0.34。玩具精度,仅示意(§9)。
  const conf = Math.max(0, Math.min(1, Math.exp(-best.d * 12)))
  // warping 对齐点对抽稀 ≤24(图 5b 绿色对应线数据)
  const stride = Math.max(1, Math.ceil(best.path.length / 24))
  const warping = []
  for (let k = 0; k < best.path.length; k += stride) {
    const [ui, ti] = best.path[k]
    warping.push({ u: user[ui], t: tpl.pts[ti] })
  }
  return {
    char: best.char,
    conf,
    warping,
    userPts: user,
    tplPts: tpl.pts,
    top6: scored.slice(0, 6).map(s => ({ char: s.char, d: s.d })),
  }
}

// 字库字符表(供 UI 展示)
export function alphabet(lang) {
  return (TPL_CACHE[lang] || TPL_CACHE.zh).map(t => t.char)
}

// 原始模板折线(Choreo 逐笔回放用):{ '十': [[[x,y],...],...], ... }
export function rawTemplates(lang) {
  return TEMPLATES[lang] || TEMPLATES.zh
}
