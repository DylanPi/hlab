// ===== dwell.js - L3 dwell decoder: evidence-accumulating confirm =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Layer: L3 decoder | Consumers: readouts needing dwell-to-confirm
//        (accessibility activation, dangerous-action confirm) | Spec: docs/UI-FRAMEWORK.md Sec.6.1
// Data flow: enter(now) starts accumulation -> tick(now) each frame returns
// conf = 1 - exp(-t/T) -> onConfirm fires exactly once per dwell at the
// threshold -> leave() zeroes conf and re-arms. Pure module: no DOM, no runtime
// imports, frame-driven by the caller.
// ===== L3 · 驻留解码器(§6.1,证据积累式确认) =====
// conf(t) = 1 − exp(−t/T),T=800ms;指针离开即归零;conf ≥ 0.98 触发动作。
// BCI 解码器置信度可见化 + 无障碍激活(运动障碍访客免精确点击)+ 危险操作
// 替代 confirm 弹窗,一物三用。
//
// 用法:
//   const d = createDwell({ T: 800, onConfirm() { ... } })
//   目标 enter 时 d.enter();帧驱动 d.tick(now) 取 conf;离开 d.leave()

// One instance per target. The confirm is one-shot per dwell: after firing,
// tick() keeps returning 1 until leave() + enter() re-arm it.
export function createDwell({ T = 800, threshold = 0.98, onConfirm } = {}) {
  let enterT = null
  let fired = false
  // enter() restarts accumulation from `now` and re-arms the one-shot;
  // leave() resets everything to zero.
  return {
    enter(now = performance.now()) { enterT = now; fired = false },
    leave() { enterT = null; fired = false },
    // 每帧调用;返回当前置信度 0–1
    tick(now = performance.now()) {
      if (enterT === null) return 0
      const conf = 1 - Math.exp(-(now - enterT) / T)
      if (conf >= threshold && !fired) {
        fired = true
        onConfirm?.()
      }
      return fired ? 1 : conf
    },
  }
}
