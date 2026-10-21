// ===== runtime.js - L1 tuning + L2 population layer of the InkIntent stack =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Layer: L1+L2 | Consumers: directives.js (v-tuned), readout components via onFrame/onFire,
//        test bench via neuronStats/resetRuntime | Spec: docs/UI-FRAMEWORK.md Sec.2, Sec.4.2-4.4, Sec.5
// Data flow: shared frame from signal.js -> ONE rAF loop -> per-neuron O(1) excitation
// (receptive-field kernel x channel tuning, summed) -> fire over effective threshold
// (habituation) with 200ms refractory -> CSS custom-property bus + fire/frame events.
// Output contract: writes ONLY CSS custom properties (--exc/--fire per element,
// --field/--field-firing on <html>) and dispatches events; readouts must never read
// other JS state. Invariants: single loop for the whole SPA; in-view active neurons
// capped at 120; rect cache refreshed on scroll/resize (dirty flag) + 600ms fallback.
// ===== 意笔 InkIntent · L1 调谐层 + L2 群体层 =====
// 元素即神经元:v-tuned 注册 → 每帧 O(1) 激发计算(§4.2) → 发放/不应期/习惯化(§4.3)
// → 把兴奋度写进 CSS 变量总线(--exc/--fire 逐元素,--field/--field-firing 全局)。
// 一个 rAF 循环,一份群体状态,无数种读出(§2);读出组件经 onFrame/onFire 挂进同一循环。
// 性能预算(§5):视口内激活神经元 ≤120;rect 缓存,滚动/resize 后下一帧刷新;一切 O(n)。

import { useIntentSignal, tickSignal, notifyDownTransition, onDownTransition } from './signal'
import { predictTarget } from './decoders/predict'

// 全局激发增益/帧(2026-10-06 初调:输入为通道加权均值 0–1,0.14/帧×泄漏0.92
// → 持续对准 ~5 帧过阈 0.5;与 A 线粒子 0.18/帧×0.94 同量级)
const GAIN = 0.14
const LEAK = 0.92          // 泄漏 τ≈12 帧
const REFRACTORY = 200     // 不应期 ms(致敬论文锋 bin 宽度,§4.3)
const FIRE_DECAY = 600     // --fire 线性衰减 ms
const ALT_RANGE = 280      // Vz 全局归一距离 px(1=远于此,0=贴上)
const ACTIVE_CAP = 120     // 视口内激活神经元上限(§5)
const SIGMA_SPEED = 0.9    // 速度带宽 σ(log 域)

const signal = useIntentSignal()

// ---- feature flag(§10.3):localStorage 显式 off 一票否决;否则容器 data-ink 优先;
// 全局默认 off。/lab 根节点带 data-ink="on"。
export function inkEnabled(el) {
  try {
    const flag = localStorage.getItem('inkintent')
    if (flag === 'off') return false
    const container = el?.closest?.('[data-ink]')
    if (container) return container.getAttribute('data-ink') === 'on'
    return flag === 'on'
  } catch { return false }
}

// ---- 神经元注册表 ----
const neurons = new Map() // el -> neuron
let neuronSeq = 0

// Fresh neuron state: exc starts at 0 and lastFire far in the past, so the
// refractory gate can never block a first fire. `el` is null for mobile neurons.
function makeNeuron(el, profile) {
  return {
    id: ++neuronSeq,
    el,
    profile: { ...profile }, // 防御拷贝:pd:'auto' 解析会改写自身,不得污染预置档案
    exc: 0,
    prevExc: 0,
    prevAlt: 1,          // 上一帧局部高度(下降沿检测)
    lastFire: -1e9,
    fireCount: 0,
    recentFires: [],     // 近 3s 发放时刻(习惯化 θ_eff 用)
    rect: null,          // {cx, cy} 缓存中心
    inView: true,
    capped: false,       // 超出 ACTIVE_CAP 被冻结
    lastWritten: { exc: '', fire: '' },
  }
}

// pd 解析:'auto' → 由视口中心向元素中心的辐射角(横向菜单自然「依次向右」,§4.1);
// 'random' → 随机;数字直用;null → 全向(k_dir 恒 1)
function resolvePd(neuron) {
  const pd = neuron.profile.pd
  if (typeof pd === 'number') return pd
  if (pd === 'random') return Math.random() * Math.PI * 2
  if (pd === 'auto' && neuron.rect) {
    return Math.atan2(neuron.rect.cy - innerHeight / 2, neuron.rect.cx - innerWidth / 2)
  }
  return null
}

// Cache the element center in viewport coords; also resolves pd:'auto' once from
// live geometry (see resolvePd above).
function refreshRect(neuron) {
  const r = neuron.el.getBoundingClientRect()
  neuron.rect = { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }
  if (neuron.profile.pd === 'auto') neuron.profile.pd = resolvePd(neuron)
}

let io = null
// Lazily create the shared IntersectionObserver that tracks per-neuron visibility;
// rootMargin pre-loads neurons just outside the viewport.
function ensureObserver() {
  if (io || typeof IntersectionObserver === 'undefined') return
  io = new IntersectionObserver(entries => {
    for (const en of entries) {
      const n = neurons.get(en.target)
      if (n) n.inView = en.isIntersecting
    }
  }, { rootMargin: '120px' })
}

// Lifecycle: registration is idempotent per element (re-register returns the
// existing neuron); returns null when the feature flag is off, leaving the
// element inert.
export function registerNeuron(el, profile) {
  if (neurons.has(el)) return neurons.get(el)
  if (!inkEnabled(el)) return null
  ensureObserver()
  const neuron = makeNeuron(el, profile)
  neurons.set(el, neuron)
  io?.observe(el)
  refreshRect(neuron)
  rectsDirty = true
  ensureLoop()
  return neuron
}

export function updateNeuron(el, profile) {
  const n = neurons.get(el)
  if (!n) return registerNeuron(el, profile)
  // 档案热更新(试验台滑杆):保留运行态,只换调谐参数
  n.profile = { ...profile }
  return n
}

// Detach cleanly: drop observer + per-element CSS bus vars (+ data-predicted);
// when the population empties, zero the global bus so no stale --field remains.
export function unregisterNeuron(el) {
  const n = neurons.get(el)
  if (!n) return
  io?.unobserve(el)
  neurons.delete(el)
  el.style.removeProperty('--exc')
  el.style.removeProperty('--fire')
  el.removeAttribute('data-predicted')
  if (predictedEl === el) predictedEl = null
  if (neurons.size === 0) {
    // 群体清空:总线归零,避免残留 --field
    writeRootVars(0, 0, true)
  }
}

// 试验台读数:激发 / 有效阈值 / 近 3s 发放数 快照
export function neuronStats(el) {
  const n = neurons.get(el)
  if (!n) return null
  const now = performance.now()
  n.recentFires = n.recentFires.filter(t => now - t < 3000)
  return { exc: n.exc, thetaEff: thetaEff(n), recent: n.recentFires.length, fires: n.fireCount }
}

// ---- 激发计算(§4.2;每帧每神经元 O(1)) ----
// Habituation: each fire within the last 3s raises the effective threshold
// linearly by `adapt`, so repeatedly brushed elements fire less and less.
function thetaEff(n) {
  return n.profile.threshold * (1 + (n.profile.adapt || 0) * n.recentFires.length)
}

// Per-frame input for one neuron (O(1)); returns { input, alt } with input 0
// outside the receptive field. Two unused params were dropped from this
// signature in H-line 2026-10-09.
function computeInput(n, f) {
  const p = n.profile
  // 双模型律(§4.4):pen-up 神经元在落笔态输入清零;pen-down 不吃方向/高度调谐
  if (p.model === 'pen-up' && f.down) return { input: 0 }
  // §3 降级表:无 hover 能力(触屏)→ pen-up 模型整体静默;dual 只剩 pen-down 相
  if (signal.state.coarse) {
    if (p.model === 'pen-up') return { input: 0 }
  }
  const penDownish = p.model === 'pen-down' || (p.model === 'dual' && (f.down || signal.state.coarse))

  // 感受野核 field(d) + 局部高度(0=贴上,1=远于感受野)
  const dx = n.rect.cx - f.x, dy = n.rect.cy - f.y
  const d = Math.hypot(dx, dy)
  const radius = p.radius || 120
  if (d >= radius) {
    n.prevAlt = 1
    return { input: 0, alt: 1 }
  }
  const field = (1 - d / radius) ** 2
  const alt = Math.max(0, 1 - d / radius)
  const desc = Math.max(0, n.prevAlt - alt) // 下降沿:笔尖压向元素才亮(§4.2 k_alt)
  n.prevAlt = alt

  // 各通道调谐核 × 显式权重 × M 个体增益,**求和**(§4.2 原文:exc ← exc + Σ_c gain(c)·k_c·field)
  // 2026-10-06 初调曾误用加权均值,单通道(握力驻留)被稀释到永不过阈,已回退为求和
  let sum = 0
  const g = signal.gains
  const ch = p.channels
  if (ch.v) {
    // 速度带宽(log 高斯):慢/快神经元各司其职;speed→0 时核为 0
    const k = f.speed > 0.5 ? Math.exp(-((Math.log(f.speed / (p.lambda || 8))) ** 2) / (2 * SIGMA_SPEED * SIGMA_SPEED)) : 0
    // 方向调谐(Georgopoulos 余弦)乘在速度核上:pd=null 全向;dirBand 收窄扇区;
    // pen-down 态不吃方向(纸上方向信息留给笔迹本身,§4.4)
    let kdir = 1
    if (!penDownish && p.pd !== null && p.pd !== undefined) {
      const cos = Math.cos(f.dir - p.pd)
      const gate = p.dirBand ? 1 - p.dirBand : 0
      kdir = cos > gate ? Math.max(0, cos) : 0
    }
    sum += ch.v * (penDownish ? 1 : g.v) * k * kdir
  }
  if (ch.alt && !penDownish) {
    // 下降沿是短促量,×6 放大逼近过程的锋感(2026-10-06 调:×6 让单次逼近可越阈)
    sum += ch.alt * g.alt * Math.min(1, desc * 6)
  }
  if (ch.g) sum += ch.g * g.g * f.grip
  if (ch.p && f.down) sum += ch.p * g.p * f.pressure
  return { input: Math.min(1.6, sum) * field, alt }
}

// ---- 事件总线(同一 rAF 内分发) ----
// Fire/frame callbacks are dispatched from inside the single rAF loop; both
// subscribe functions return an unsubscribe. Frame subscribers keep the loop
// alive even with zero registered neurons (e.g. canvas readouts).
const fireSubs = new Set()
const frameSubs = new Set()
export function onFire(cb) { fireSubs.add(cb); return () => fireSubs.delete(cb) }
export function onFrame(cb) { frameSubs.add(cb); ensureLoop(); return () => frameSubs.delete(cb) }

// ---- 移动神经元(§7 R2 落墨放电) ----
// 笔尖是「跟着指针走的元素」:注册时给 posFn() 取位置(视口坐标),每帧取一次。
// 激发/发放走同一条管线与同一个事件总线;无 DOM 元素故不写 CSS 变量。
const mobiles = []
export function registerMobileNeuron(posFn, profile) {
  const m = makeNeuron(null, profile)
  m.mobile = true
  m.posFn = posFn
  m.rect = posFn()
  mobiles.push(m)
  ensureLoop()
  return m
}
export function unregisterMobileNeuron(handle) {
  const i = mobiles.indexOf(handle)
  if (i >= 0) mobiles.splice(i, 1)
}

// ---- 意图预测(§6.4):群体向量 argmax,边际>0.2 → data-predicted ----
let predictOn = false
let predictedEl = null
export function enablePredict(v) { predictOn = v; if (!v && predictedEl) { predictedEl.removeAttribute('data-predicted'); predictedEl = null } }

// ---- 唯一 rAF 循环 ----
let rafId = 0
let lastT = 0
let rectsDirty = true
let lastRectRefresh = 0
let firingWindow = [] // 近 1s 发放时刻(--field-firing)

// Writes (or clears) the two global custom properties on <html>.
function writeRootVars(field, firing, clear = false) {
  const root = document.documentElement.style
  if (clear) {
    root.removeProperty('--field')
    root.removeProperty('--field-firing')
    return
  }
  root.setProperty('--field', field.toFixed(3))
  root.setProperty('--field-firing', firing.toFixed(3))
}

// One frame, phases in order: (1) advance signal + down-transition watchers,
// (2) refresh dirty/stale rect cache, (3) excite/fire in-view neurons under the
// active cap, then mobile neurons, (4) aggregate the population field + intent
// prediction, (5) write frame.altitude back to the signal layer, (6) notify
// frame subscribers, (7) re-arm rAF only while there is work.
function tick(now) {
  const dt = lastT ? Math.min(100, now - lastT) : 16.67
  lastT = now
  const dtScale = Math.max(0.5, Math.min(2, dt / 16.67))
  const f = tickSignal(now, dt)
  notifyDownTransition()

  // rect 缓存:滚动/resize 置脏,下一帧统一刷新;每 600ms 兜底刷(布局漂移)
  if (rectsDirty || now - lastRectRefresh > 600) {
    for (const n of neurons.values()) refreshRect(n)
    rectsDirty = false
    lastRectRefresh = now
  }

  // 激发 → 发放 → CSS 总线;视口外/超上限神经元冻结(§5)
  const active = []
  let activeCount = 0
  for (const n of neurons.values()) {
    if (!n.inView) { if (n.exc > 0) { n.exc = 0; writeExc(n) } continue }
    activeCount++
    n.capped = activeCount > ACTIVE_CAP
    if (n.capped) continue
    active.push(n)
    const { input } = computeInput(n, f)
    n.prevExc = n.exc
    n.exc = Math.min(1.2, (n.exc + input * GAIN * dtScale) * Math.pow(LEAK, dtScale))

    // 发放:越过有效阈值(含习惯化上调)且过不应期(§4.3)
    n.recentFires = n.recentFires.filter(t => now - t < 3000)
    const th = thetaEff(n)
    if (n.exc >= th && now - n.lastFire > REFRACTORY) {
      n.lastFire = now
      n.fireCount++
      n.recentFires.push(now)
      firingWindow.push(now)
      const ev = {
        id: n.id, el: n.el, profile: n.profile.name || 'custom',
        x: n.rect.cx, y: n.rect.cy, dir: f.dir, t: now,
      }
      for (const cb of fireSubs) cb(ev)
    }
    writeExc(n)
    writeFire(n, now)
  }

  // 移动神经元(笔尖 inkDot 等):每帧从 posFn 取位,同管线激发/发放;
  // 无 DOM 元素 → 只进事件总线与全局场,不写 CSS 变量
  for (const n of mobiles) {
    n.rect = n.posFn() || n.rect
    const { input } = computeInput(n, f)
    n.prevExc = n.exc
    n.exc = Math.min(1.2, (n.exc + input * GAIN * dtScale) * Math.pow(LEAK, dtScale))
    n.recentFires = n.recentFires.filter(t => now - t < 3000)
    if (n.exc >= thetaEff(n) && now - n.lastFire > REFRACTORY) {
      n.lastFire = now
      n.fireCount++
      n.recentFires.push(now)
      firingWindow.push(now)
      const ev = {
        id: n.id, el: null, mobile: true, profile: n.profile.name || 'mobile',
        x: n.rect.cx, y: n.rect.cy, dir: f.dir, t: now,
      }
      for (const cb of fireSubs) cb(ev)
    }
    active.push(n)
  }

  // 群体层:全局兴奋场均值 + 近 1s 发放频率(背景类读出只消费这两个量,§5)
  if (active.length) {
    const field = active.reduce((s, n) => s + n.exc, 0) / active.length
    firingWindow = firingWindow.filter(t => now - t < 1000)
    writeRootVars(Math.min(1, field), firingWindow.length / 10)
    // Intent prediction candidates: only neurons backed by a real DOM element
    // (mobile pen-tip neurons have no element to mark).
    if (predictOn) {
      const cands = []
      for (const n of active) {
        if (n.el) cands.push({ el: n.el, exc: n.exc, cx: n.rect.cx, cy: n.rect.cy, radius: n.profile.radius })
      }
      const el = predictTarget(cands, f)
      if (el !== predictedEl) {
        predictedEl?.removeAttribute('data-predicted')
        el?.setAttribute('data-predicted', '')
        predictedEl = el
      }
    }
  } else if (neurons.size === 0) {
    writeRootVars(0, 0)
  }

  // 全局最近目标距离 → frame.altitude(信号层 Vz 通道的「高度」)
  let dmin = Infinity
  for (const n of active) {
    const d = Math.hypot(n.rect.cx - f.x, n.rect.cy - f.y) - (n.profile.radius || 120)
    if (d < dmin) dmin = d
  }
  f.altitude = dmin === Infinity ? 1 : Math.max(0, Math.min(1, dmin / ALT_RANGE))

  for (const cb of frameSubs) cb(now, dt)

  // 活化条件:有神经元/移动神经元或有订阅者;reduced/disabled 时停转(§3 降级表)
  if (neurons.size > 0 || mobiles.length > 0 || frameSubs.size > 0) rafId = requestAnimationFrame(tick)
  else rafId = 0
}

// CSS bus writes are change-gated (lastWritten) so steady-state frames never
// touch element.style.
function writeExc(n) {
  const v = Math.max(0, Math.min(1, n.exc)).toFixed(3)
  if (v !== n.lastWritten.exc) {
    n.el.style.setProperty('--exc', v)
    n.lastWritten.exc = v
  }
}

// --fire decays linearly from 1 at fire time to 0 after FIRE_DECAY ms; once
// fully decayed the property is zeroed once and then left untouched.
function writeFire(n, now) {
  const age = now - n.lastFire
  if (age > FIRE_DECAY) {
    if (n.lastWritten.fire !== '') { n.el.style.setProperty('--fire', '0'); n.lastWritten.fire = '' }
    return
  }
  const v = (1 - age / FIRE_DECAY).toFixed(3)
  if (v !== n.lastWritten.fire) {
    n.el.style.setProperty('--fire', v)
    n.lastWritten.fire = v
  }
}

// Start the loop only when there is work AND motion is allowed; reduced or
// disabled signal states keep rafId at 0 (loop simply not re-armed).
function ensureLoop() {
  if (signal.state.disabled || signal.state.reduced) return
  if (!rafId && (neurons.size > 0 || mobiles.length > 0 || frameSubs.size > 0)) {
    lastT = 0
    rafId = requestAnimationFrame(tick)
  }
}

// 滚动/resize → 下一帧刷新 rect 缓存
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => { rectsDirty = true }, { passive: true })
  window.addEventListener('resize', () => { rectsDirty = true }, { passive: true })
  // reduced-motion 运行时切换:停转并清零总线(功能保留在解码层,§3)
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', e => {
    if (e.matches && rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
      for (const n of neurons.values()) { n.exc = 0; writeExc(n); writeFire(n, performance.now() + 1e6) }
      writeRootVars(0, 0)
    } else if (!e.matches) ensureLoop()
  })
}

// 双模型切换:pointerdown/up 两个模型各自重置激发(§4.4,杜绝过渡态错乱)
onDownTransition(() => {
  for (const n of neurons.values()) { n.exc = 0; n.prevExc = 0; n.prevAlt = 1 }
})

// 测试钩子
export function resetRuntime() {
  for (const el of [...neurons.keys()]) unregisterNeuron(el)
  mobiles.length = 0
  firingWindow = []
  writeRootVars(0, 0, true)
}
export const runtimeActive = () => !!rafId
