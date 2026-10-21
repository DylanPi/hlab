<script setup>
// ===== NeuralCanvas — homepage hero canvas: standalone particle-neuron simulation =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Runs its own rAF loop, independent of the ink framework (coexistence is a documented
// decision); colors come from src/theme.js. A1 direction-tuned excitation: cursor motion
// excites nodes whose preferred direction aligns (cos > 0.4) within 170px; gain
// 0.18/frame, decay 0.94, 90ms refractory. A2 signal ring: spikes project by azimuth
// onto an inset ring at the hero border. A3 CTA chain: hover locks the button center
// and attracts nodes onto the mouse->button segment; click bursts 12 traveling sparks.
// Particle cap 140 (density 1 node / 14000 px^2). Reduced-motion is runtime-switchable
// via a matchMedia listener (rAF stops, one static frame is drawn).
// Props: ctaEl (CTA button element), ctaHover, burst ({n, x, y}; bump n to retrigger).
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { ACCENT, LINK, rgba } from '../theme'

// 首页 Hero 背景：神经元粒子 + 连线 + 信号环（原底部脑电波已于三轮删除）
// A1 方向调谐 / A2 raster 放电（信号环形态）/ A3 CTA 募集链（交互计划阶段 A）
const props = defineProps({
  ctaEl: Object, // 主 CTA 按钮元素（悬停成链的端点）
  ctaHover: Boolean,
  burst: Object, // {n, x, y} 点击爆发，n 递增触发
})
const cv = ref(null)
let raf = 0
let nodes = []
// Backing-store geometry. W/H stay in CSS pixels so simulation, pointer coordinates and
// ring math are unchanged; only the canvas bitmap and 2D transform are DPR-scaled.
let W = 0
let H = 0
let dpr = 1
// pointer position in canvas coords; -999 is the "no pointer" sentinel set on mouseleave
let mouse = { x: -999, y: -999 }
let prevMouse = { x: -999, y: -999 }
let mv = { x: 0, y: 0 } // 鼠标帧速度（EMA 平滑）
let ticks = [] // 信号环放电刻度 {th, t}，上限 300
let ctaCenter = null // CTA 中心（canvas 坐标），悬停开始时取一次
let chainOn = false
let sparks = [] // A3 光点 {t0, from, to}，450ms ease-in 传播
// reduced-motion：改为运行时可切换（与 ink/runtime.js 对齐；原先只取一次快照，
// 系统级切换后本画布不会跟随）。切换时停转/重启 rAF 并补一帧静态画面。
const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)')
let reduced = reducedMQ.matches
function onReducedChange(e) {
  reduced = e.matches
  if (reduced) {
    cancelAnimationFrame(raf)
    raf = 0
    if (cv.value) draw(W, H)
  } else if (cv.value) {
    raf = requestAnimationFrame(tick)
  }
}
const SPIKE_TH = 0.45 // 发放阈值
const REFRACTORY = 90 // 不应期 ms（持续激发下重复发放）

// CTA 按钮中心换算为 canvas 坐标（悬停锁定与触屏爆发两处共用）
function ctaCenterInCanvas() {
  const br = props.ctaEl.getBoundingClientRect()
  const cr = cv.value.getBoundingClientRect()
  return { x: br.left + br.width / 2 - cr.left, y: br.top + br.height / 2 - cr.top }
}

// A3：悬停开始时锁定按钮中心；点击爆发 → 12 光点沿线段传播
watch(() => props.ctaHover, v => {
  chainOn = v && !reduced
  if (chainOn && props.ctaEl && cv.value) {
    ctaCenter = ctaCenterInCanvas()
  }
})
watch(() => props.burst, b => {
  if (!b || reduced || !cv.value || !props.ctaEl) return
  // 触屏无 hover（ctaCenter 未锁定）时按需取按钮中心，保证点击仍有传播光点
  if (!ctaCenter) ctaCenter = ctaCenterInCanvas()
  const cr = cv.value.getBoundingClientRect()
  const from = { x: b.x - cr.left, y: b.y - cr.top }
  const to = ctaCenter
  const t0 = performance.now()
  for (let i = 0; i < 12; i++) sparks.push({ t0: t0 + i * 14, from, to })
})

// 信号环内缩：顶部避开导航栏，底部避开 SCROLL 提示，左右贴边（小窗口时侧轨始终可见）
const RING_T = 74, RING_B = 40, RING_X = 14
const ringCy = h => (RING_T + h - RING_B) / 2

// 方位角 → 环上落点（环心射线与内缩矩形求交）
function ringHit(th, w, h) {
  const cx = w / 2, cy = ringCy(h)
  const hw = w / 2 - RING_X
  const hh = (h - RING_B - RING_T) / 2
  const c = Math.cos(th), s = Math.sin(th)
  const tx = Math.abs(c) < 1e-6 ? Infinity : hw / Math.abs(c)
  const ty = Math.abs(s) < 1e-6 ? Infinity : hh / Math.abs(s)
  // t = smallest scale at which the ray (cos, sin) crosses the inset rectangle boundary
  const t = Math.min(tx, ty)
  return { x: cx + c * t, y: cy + s * t, vertical: tx < ty } // vertical=命中左右轨
}

function fire(p, now, w, h) {
  if (p.exc >= SPIKE_TH && now - p.lastSpike > REFRACTORY) {
    p.lastSpike = now
    const th = Math.atan2(p.y - ringCy(h), p.x - w / 2)
    ticks.push({ th, t: now })
    if (ticks.length > 300) ticks.shift()
  }
}

function setup(w, h) {
  // 上限 140（2026-09-27 三轮：90 在全屏视口下过疏；fps 实测仍 ≥45）
  const n = Math.min(140, Math.max(36, Math.floor((w * h) / 14000)))
  nodes = Array.from({ length: n }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: 1.2 + Math.random() * 2.2,
    pd: Math.random() * Math.PI * 2, // 偏好方向 preferred direction
    exc: 0, // 激发度 0–1，每帧 ×0.94 衰减
    lastSpike: -1e9, // 上次发放时刻（不应期用）
  }))
}

function draw(w, h) {
  const ctx = cv.value.getContext('2d')
  ctx.clearRect(0, 0, w, h)

  // 连线：平方距离剪枝 + alpha 量化 8 档分桶批量描线（140 粒子时把数百次
  // stroke() 降到 8 次，1920 视口帧率达标；量化步长 0.07 视觉不可辨）
  const D = 130
  const D2 = D * D
  const buckets = Array.from({ length: 8 }, () => [])
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]
      const dx = a.x - b.x, dy = a.y - b.y
      const q2 = dx * dx + dy * dy
      if (q2 >= D2) continue
      const d = Math.sqrt(q2)
      // 空闲峰值 0.38；两端任一粒子激发时抬升至 0.55 封顶——网络沿扫动路径点亮
      const e = Math.max(a.exc, b.exc)
      const alpha = (1 - d / D) * Math.min(0.55, 0.38 + 0.3 * e)
      // 8-bucket alpha quantization: bi = min(7, floor(alpha*14)) batches all segments
      // into 8 stroke() calls; the bucket's paint alpha is its midpoint, (bi+0.5)/14.
      const bi = Math.min(7, (alpha * 14) | 0)
      buckets[bi].push(a.x, a.y, b.x, b.y)
    }
  }
  ctx.lineWidth = 1
  for (let bi = 0; bi < 8; bi++) {
    const seg = buckets[bi]
    if (!seg.length) continue
    ctx.strokeStyle = rgba(LINK, ((bi + 0.5) / 14).toFixed(3))
    ctx.beginPath()
    for (let k = 0; k < seg.length; k += 4) {
      ctx.moveTo(seg[k], seg[k + 1])
      ctx.lineTo(seg[k + 2], seg[k + 3])
    }
    ctx.stroke()
  }
  // 鼠标呼应连线（激发的更亮，未激发压暗，强化对比）
  for (const p of nodes) {
    const d = Math.hypot(p.x - mouse.x, p.y - mouse.y)
    if (d < 170) {
      const alpha = (1 - d / 170) * 0.5 * (0.65 + 0.35 * p.exc)
      ctx.strokeStyle = rgba(ACCENT, alpha)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(mouse.x, mouse.y)
      ctx.stroke()
    }
  }
  // 神经元（激发时向 --accent 插值 + 半径/辉光脉冲）
  for (const p of nodes) {
    const e = p.exc
    if (e > 0.15) {
      ctx.fillStyle = rgba(ACCENT, 0.25 * e)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r + e * 5, 0, Math.PI * 2)
      ctx.fill()
    }
    // 静息蓝 (140,200,255) → accent(56,214,255) 随激发插值
    const cr = Math.round(140 + (ACCENT.r - 140) * e)
    const cg = Math.round(200 + (ACCENT.g - 200) * e)
    ctx.fillStyle = `rgba(${cr},${cg},255,0.85)`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r + e * 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
  // A3 光点传播：12 点沿线段 450ms ease-in 抵达按钮
  const sn = performance.now()
  sparks = sparks.filter(s => sn < s.t0 + 460)
  for (const s of sparks) {
    let u = (sn - s.t0) / 450
    if (u < 0) continue
    u = u > 1 ? 1 : u
    const e = u * u
    ctx.fillStyle = rgba(ACCENT, 0.9 - u * 0.3)
    ctx.beginPath()
    ctx.arc(s.from.x + (s.to.x - s.from.x) * e, s.from.y + (s.to.y - s.from.y) * e, 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
  // 信号环（raster 三轮改版）：发放粒子按方位角投射到 hero 内缘的环上，
  // 落点画垂直于轨的短刻度（新生 120ms 高度 7→4 弹出、之后 680ms 内 0.9 淡出）；
  // 常驻极淡描边作锚点。环贴左右边缘——短视口/小窗口下侧轨始终可见，不再依赖滚动。
  // 原"底部刻度带"两轮均不达标（一轮被 CTA 遮挡、二轮仍不够显眼且低于折叠线）。
  // reduced 下环与刻度均不显示，保持静态帧干净
  if (!reduced) {
    ctx.strokeStyle = rgba(ACCENT, 0.06)
    ctx.lineWidth = 1
    ctx.strokeRect(RING_X + 0.5, RING_T + 0.5, w - RING_X * 2 - 1, h - RING_T - RING_B - 1)
  }
  const now = performance.now()
  ticks = ticks.filter(k => now - k.t < 800)
  for (const k of ticks) {
    const age = now - k.t
    const a = age < 120 ? 1 : 0.9 * (1 - (age - 120) / 680)
    const hh = 4 + 3 * Math.max(0, 1 - age / 120) // 弹出：7→4px
    const q = ringHit(k.th, w, h)
    ctx.fillStyle = rgba(ACCENT, a)
    if (q.vertical) ctx.fillRect(Math.round(q.x - hh / 2), Math.round(q.y - 1), hh, 2)
    else ctx.fillRect(Math.round(q.x - 1), Math.round(q.y - hh / 2), 2, hh)
  }
}

function tick() {
  const w = W, h = H
  // 帧间差分 + EMA 得鼠标速度；静止（<2px/帧）不激发
  if (mouse.x < -900 || prevMouse.x < -900) {
    mv.x = 0
    mv.y = 0
  } else {
    mv.x = mv.x * 0.7 + (mouse.x - prevMouse.x) * 0.3
    mv.y = mv.y * 0.7 + (mouse.y - prevMouse.y) * 0.3
  }
  prevMouse.x = mouse.x
  prevMouse.y = mouse.y
  const spd = Math.hypot(mv.x, mv.y)
  const mvAng = Math.atan2(mv.y, mv.x)
  const moving = spd >= 2
  const now = performance.now()
  for (const p of nodes) {
    // 方向调谐：运动方向与偏好方向一致（cos > 0.4）且在鼠标 170px 邻域内才激发。
    // 增益 0.18/帧 × 衰减 0.94：粒子过境 ~7 帧即峰值 ~0.7，拖尾 ~0.8s
    if (moving) {
      const d = Math.hypot(p.x - mouse.x, p.y - mouse.y)
      if (d < 170) {
        const align = Math.cos(mvAng - p.pd)
        if (align > 0.4) p.exc = Math.min(1, p.exc + 0.18 * align)
      }
      // 高激发粒子沿运动方向轻微漂移（接力感；0.25px/帧上限，观感二轮从 0.6 调低）
      if (p.exc > 0.5) {
        const drift = p.exc * 0.25
        p.x += Math.cos(mvAng) * drift
        p.y += Math.sin(mvAng) * drift
      }
      // raster：激发越阈即发放（90ms 不应期，可持续发放），
      // 刻度按粒子方位角投射到信号环上（渲染见 draw）
      fire(p, now, w, h)
    }
    p.exc *= 0.94
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0 || p.x > w) p.vx *= -1
    if (p.y < 0 || p.y > h) p.vy *= -1
  }
  // A3 募集链：悬停时把「鼠标→按钮中心」线段 <55px 邻域的粒子吸上链并点亮
  if (chainOn && ctaCenter && mouse.x > -900) {
    const ax = mouse.x, ay = mouse.y
    const dx = ctaCenter.x - ax, dy = ctaCenter.y - ay
    const len2 = dx * dx + dy * dy || 1
    for (const p of nodes) {
      let t = ((p.x - ax) * dx + (p.y - ay) * dy) / len2
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const px = ax + dx * t, py = ay + dy * t
      const d = Math.hypot(p.x - px, p.y - py)
      if (d < 55) {
        const pull = (1 - d / 55) * 0.35
        p.x += (px - p.x) * pull
        p.y += (py - p.y) * pull
        p.exc = Math.max(p.exc, 0.6 + 0.4 * (1 - d / 55))
      }
    }
  }
  draw(w, h)
  raf = requestAnimationFrame(tick)
}

function resize() {
  // Resize re-seeds the node field (excitation state intentionally resets) and repaints
  // one static frame under reduced-motion so the canvas never goes blank.
  // DPR is clamped to 2: retina-crisp without quadrupling fill cost on 3x phones.
  const parent = cv.value.parentElement
  W = parent.clientWidth
  H = parent.clientHeight
  dpr = Math.min(2, window.devicePixelRatio || 1)
  cv.value.width = Math.round(W * dpr)
  cv.value.height = Math.round(H * dpr)
  // Assigning width/height resets the context state, so re-apply the scale every resize.
  cv.value.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
  setup(W, H)
  if (reduced) draw(W, H)
}

function onMove(e) {
  const rect = cv.value.getBoundingClientRect()
  mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top }
}
function onLeave() {
  mouse = { x: -999, y: -999 }
  prevMouse = { x: -999, y: -999 }
  mv.x = 0
  mv.y = 0
}

let parent = null

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  parent = cv.value.parentElement
  parent.addEventListener('mousemove', onMove)
  parent.addEventListener('mouseleave', onLeave)
  reducedMQ.addEventListener?.('change', onReducedChange)
  if (!reduced) raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  reducedMQ.removeEventListener?.('change', onReducedChange)
  parent?.removeEventListener('mousemove', onMove)
  parent?.removeEventListener('mouseleave', onLeave)
})
</script>

<template>
  <!-- 画布自身 pointer-events:none（CSS），指针监听挂在父容器 onMounted 处；
       模板层不再绑 @mousemove/@mouseleave（H 线清理：死绑定，永不触发） -->
  <canvas ref="cv" class="neural-canvas" aria-hidden="true"></canvas>
</template>

<style scoped>
.neural-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
