// ===== signal.js - L0 signal layer of the InkIntent stack =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Layer: L0 | Consumers: runtime.js (its single rAF loop calls tickSignal each
//        frame; test hooks setDown/notifyDownTransition) | Spec: docs/UI-FRAMEWORK.md Sec.3
// Data flow: raw pointer events (passive capture listeners) -> raw sample ->
// tickSignal() advances the ONE shared 5-channel frame (Vxy speed EMA, Vz
// altitude written back by runtime, P pressure, G grip, M per-visitor gains).
// Degradation flags on `state`: disabled (no PointerEvent), reduced
// (prefers-reduced-motion), coarse (hover:none or pointer:coarse). The frame is
// a global singleton mutated in place - the whole SPA shares one object.
// ===== 意笔 InkIntent · L0 信号层 =====
// 把原生指针事件加工成多维信号流(五通道),拒绝把输入降维成坐标点。
// 全局单例:SPA 内共享一份 frame;runtime 的唯一 rAF 循环每帧调用 tick()。
// 通道定义见 docs/UI-FRAMEWORK.md §3:
//   Vxy 纸面速度(EMA α=0.3) / Vz 离面高度(由 runtime 写入全局最近距离) /
//   P 压力(硬件或合成) / G 握力(驻留能量) / M 个体特征(localStorage 元通道)
//
// 降级广播(§3 降级表):
//   no PointerEvent → disabled(框架整体 noop)
//   prefers-reduced-motion → reduced(循环停转,读出静止;主动解码保留)
//   hover:none(触屏为主)→ coarse(pen-up 模型整体静默)

const M_STORAGE_KEY = 'haolab-inkintent-m'

// The single mutable frame object; initial state = pointer far off-screen, all
// channels idle. Mutated in place by tickSignal, never reallocated.
function initialFrame() {
  return {
    t: 0, x: -1e9, y: -1e9,        // 位置(px,视口坐标;未见过指针时在屏外)
    vx: 0, vy: 0, speed: 0,        // EMA 平滑速度(px/帧)
    dir: 0,                        // 速度方向弧度(speed<2px/帧时保持且 isIdle)
    pressure: 0,                   // 0–1(真实或合成)
    altitude: 1,                   // 0–1,1=远离一切目标(runtime 每帧写入全局最近距离)
    grip: 0,                       // 0–1 驻留能量:speed<4px/帧 +0.04/帧,否则 ×0.9
    down: false,                   // pen-up / pen-down
    isIdle: true,
  }
}

const signal = {
  frame: initialFrame(),
  state: {
    disabled: typeof window === 'undefined' || !window.PointerEvent,
    reduced: false,
    coarse: false,
  },
  // M 元通道:个体输入特征 → 各通道增益(默认全 1,±15% 内微调)
  gains: { v: 1, g: 1, alt: 1, p: 1 },
}

// ---- 内部状态(不导出) ----
let started = false
let lastPos = null            // 上一帧位置(帧间差分用)
let raw = { x: -1e9, y: -1e9, pressure: 0, pointerType: 'mouse' }
let lastMoveT = 0

// M 通道的会话统计(EMA)
const mStats = { meanSpeed: 0, clicks: [], scrollV: 0, lastScrollY: 0, samples: 0 }

// Hydrate the M-channel gains from localStorage over the defaults.
function loadGains() {
  try {
    const s = JSON.parse(localStorage.getItem(M_STORAGE_KEY) || 'null')
    if (s && typeof s === 'object') signal.gains = { ...signal.gains, ...s }
  } catch { /* 损坏则回到默认 */ }
}

// Persist the current M gains (best effort).
function saveGains() {
  try { localStorage.setItem(M_STORAGE_KEY, JSON.stringify(signal.gains)) } catch { /* 隐私模式忽略 */ }
}

// 由会话统计更新 M 增益:快用户压低 v 权重、抬高 g(慢驻留更显著);
// 点击节奏快 → p 略升。幅度限制在 ±15%,只做气质微调,不改变档案排序。
function recomputeGains() {
  const spd = mStats.meanSpeed || 0
  const cad = mStats.clicks.length >= 4 ? 60000 / (Date.now() - mStats.clicks[0]) * mStats.clicks.length / 1000 : 0
  const clamp01 = v => Math.max(0.85, Math.min(1.15, v))
  signal.gains.v = clamp01(1.06 - Math.min(0.21, spd * 0.012))
  signal.gains.g = clamp01(0.94 + Math.min(0.21, spd * 0.012))
  signal.gains.p = clamp01(1 + Math.min(0.15, cad * 0.1))
  signal.gains.alt = 1
  saveGains()
}

// Raw sample capture only; all smoothing is deferred to tickSignal. pointerType
// recorded here decides the pressure source (hardware vs synthesized) later.
function onPointerMove(e) {
  raw.x = e.clientX
  raw.y = e.clientY
  raw.pointerType = e.pointerType
  // 硬件压力:pen 与 force-touch 给真实值;mouse 恒 0.5(交由合成),touch 默认 0.5
  if (e.pointerType === 'pen' || (e.pressure > 0 && e.pressure !== 0.5)) raw.pressure = e.pressure
  lastMoveT = performance.now()
}

// pen-down also feeds the M click-cadence ring (last 12 click timestamps).
function onPointerDown(e) {
  signal.frame.down = true
  onPointerMove(e)
  mStats.clicks.push(Date.now())
  if (mStats.clicks.length > 12) mStats.clicks.shift()
}

// pointercancel maps here as well - both return to the pen-up state.
function onPointerUp() {
  signal.frame.down = false
}

function onLeave() {
  // 指针离开文档:速度清零、位置出屏(感受野自然失活)
  raw.x = -1e9
  raw.y = -1e9
  lastPos = null
}

// Scroll velocity EMA feeds the M stats; sustained fast scrolling slowly pulls
// meanSpeed toward 4 px/frame so heavy scrollers are treated as fast users.
function onScroll() {
  const y = window.scrollY
  const dv = Math.abs(y - mStats.lastScrollY)
  mStats.lastScrollY = y
  mStats.scrollV = mStats.scrollV * 0.8 + dv * 0.2
  if (mStats.scrollV > 40) mStats.meanSpeed = mStats.meanSpeed * 0.995 + 4 * 0.005
}

// Lazy one-time wire-up on first call; returns the shared singleton. When the
// environment is disabled (no PointerEvent, e.g. SSR) nothing ever attaches.
export function useIntentSignal() {
  if (!started && !signal.state.disabled) {
    started = true
    window.addEventListener('pointermove', onPointerMove, { passive: true, capture: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true, capture: true })
    window.addEventListener('pointercancel', onPointerUp, { passive: true, capture: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
    signal.state.reduced = rm.matches
    rm.addEventListener?.('change', ev => { signal.state.reduced = ev.matches })
    const hv = window.matchMedia('(hover: none)')
    signal.state.coarse = hv.matches || window.matchMedia('(pointer: coarse)').matches
    hv.addEventListener?.('change', ev => { signal.state.coarse = ev.matches })
    loadGains()
    mStats.lastScrollY = window.scrollY
    // M 增益每 6s 随手更新(会话级元通道,不需要帧频)。
    // SPA 生命周期常驻定时器,有意不保存句柄(H 线清理:原先写入 mTimer 但从不读取)
    setInterval(() => recomputeGains(), 6000)
  }
  return signal
}

// 每帧推进一次(由 runtime 的唯一 rAF 循环调用;dt 毫秒)
export function tickSignal(now, dt) {
  const f = signal.frame
  f.t = now
  const dtScale = Math.max(0.5, Math.min(2, dt / 16.67))

  // 位置与帧间差分 + EMA(α=0.3);指针出屏(未见过)时速度归零
  if (raw.x < -1e8 || lastPos === null) {
    f.vx *= 0.6
    f.vy *= 0.6
    f.x = raw.x
    f.y = raw.y
  } else {
    f.x = raw.x
    f.y = raw.y
    f.vx = f.vx * 0.7 + (f.x - lastPos.x) * 0.3
    f.vy = f.vy * 0.7 + (f.y - lastPos.y) * 0.3
  }
  lastPos = { x: f.x, y: f.y }
  f.speed = Math.hypot(f.vx, f.vy)
  if (f.speed >= 2) {
    f.dir = Math.atan2(f.vy, f.vx)
    f.isIdle = false
  } else {
    f.isIdle = true // 慢于 2px/帧:方向保持上次值
  }

  // 握力 G:慢=握持(驻留积累),快=掠过(衰减)
  if (f.speed < 4) f.grip = Math.min(1, f.grip + 0.04 * dtScale)
  else f.grip *= Math.pow(0.9, dtScale)

  // 压力 P:pen/force 用硬件值;mouse 在 pen-down 态用「握力」合成(慢按=重)
  if (raw.pointerType === 'pen' || (raw.pressure > 0 && raw.pressure !== 0.5)) {
    f.pressure = f.down ? raw.pressure : 0
  } else if (f.down) {
    f.pressure = Math.min(1, 0.5 + 0.45 * f.grip)
  } else {
    f.pressure = 0
  }

  // Vz/altitude 由 runtime 写入(需要神经元感受野信息);静止太久时缓慢回满
  if (now - lastMoveT > 400) f.altitude = Math.min(1, f.altitude + 0.02 * dtScale)

  // M 会话统计(轻量 EMA,只看移动帧)
  if (!f.isIdle && f.speed < 80) {
    mStats.meanSpeed = mStats.samples < 30 ? (mStats.meanSpeed * mStats.samples + f.speed) / (mStats.samples + 1) : mStats.meanSpeed * 0.999 + f.speed * 0.001
    mStats.samples++
  }
  // Returns the SAME frame object every call (mutated in place, zero per-frame allocation).
  return f
}

// 双模型切换钩子:runtime 监听 down 态跳变以重置两套激发(§4.4)
let downWatchers = []
export function onDownTransition(cb) {
  downWatchers.push(cb)
  return () => { downWatchers = downWatchers.filter(f => f !== cb) }
}
let lastDown = false
export function notifyDownTransition() {
  if (signal.frame.down !== lastDown) {
    lastDown = signal.frame.down
    for (const cb of downWatchers) cb(signal.frame.down)
  }
}

// 测试/演示钩子:直接改 frame.down(合成事件路径绕过 window 监听时)
export function setDown(v) {
  signal.frame.down = v
  notifyDownTransition()
}
