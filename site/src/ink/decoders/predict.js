// ===== predict.js - L3 intent prediction via population-vector argmax =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Layer: L3 decoder | Consumers: runtime.js tick() (feeds snapshots of active
//        neurons and writes data-predicted on the winner) | Spec: docs/UI-FRAMEWORK.md Sec.6.4
// Data flow: candidates [{el, exc, cx, cy, radius}] + signal frame ->
// score = exc x field(d)^2 -> argmax, accepted only above PREDICT_MIN and with
// a runner-up margin > PREDICT_MARGIN. Pure function: never reads runtime
// state back (avoids a circular dependency).
// ===== L3 · 意图预测(§6.4,群体向量) =====
// score(el) = exc × field(d),argmax 即预测目标;置信边际 > 0.2 时该元素获得
// data-predicted(CSS 可做轻微放大/磁吸视觉)。无障碍模式核心之一:
// 配合驻留解码,运动障碍访客无需精确点击。
// 纯函数:runtime 每帧把激活神经元快照喂进来,不回读 runtime(避免环依赖)。

export const PREDICT_MIN = 0.12 // 最低得分:低于此视为无意图
export const PREDICT_MARGIN = 0.2 // 置信边际(§6.4 原值)

// candidates: [{el, exc, cx, cy, radius}]; f: 信号帧(用 f.x/f.y)
// 返回得分最高的元素或 null
export function predictTarget(candidates, f) {
  // Single pass tracking best and runner-up: when a new score displaces the
  // current best, the old best becomes the runner-up.
  let best = null
  let second = 0
  for (const c of candidates) {
    const d = Math.hypot(c.cx - f.x, c.cy - f.y)
    // Receptive-field kernel (1 - d/r) squared - same shape as runtime's
    // field(), squared for sharper distance falloff.
    const fr = Math.max(0, 1 - d / (c.radius || 120))
    const s = c.exc * fr * fr
    if (!best || s > best.s) {
      if (best) second = best.s
      best = { el: c.el, s }
    } else if (s > second) second = s
  }
  if (best && best.s > PREDICT_MIN && best.s - second > PREDICT_MARGIN) return best.el
  return null
}
