<script setup>
// ===== ArcRecruit - R3 bezier-arc particle recruitment onto a firing target (sec.7, fig 3d/e) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: subscribes onFrame/onFire + CSS vars only (UI-FRAMEWORK sec.5/sec.7). Degrades to one static frame when reduced/flag-off (sec.3).
// On a fire event from the v-tuned CTA button, the 8 nearest drifting particles fly quadratic-bezier
// arcs (control point offset perpendicular to the chord, alternating sides) with easeOutBack overshoot,
// orbit the target ~1.6s, then fall back to drift. Idle particles are LINK blue; recruited ones turn
// ACCENT cyan with a soft halo.
// R3 弧线募集(§7,图 3d/e):目标按钮发放时,邻近粒子沿带过冲回弹的贝塞尔弧线
// 被吸向目标,环绕片刻后散回漂移。消费 cta 神经元的 fire 事件与 --exc(§7 约定:
// 事件 + CSS 变量,不读其它 JS 状态)。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onFire, onFrame } from '../runtime'
import { useIntentSignal } from '../signal'
import { setupCanvas } from '../utils/canvas'
import { ACCENT, LINK, rgba } from '../../theme'

const props = defineProps({ active: Boolean })
const { t } = useI18n()
const signal = useIntentSignal()
const cv = ref(null)
const target = ref(null)

let parts = []
let unsubFire = () => {}
let unsubFrame = () => {}

function setup(w, h) {
  const n = 34
  parts = Array.from({ length: n }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    r: 1.4 + Math.random() * 1.4,
    state: 'drift', // drift | arc | orbit
    arc: null, orbitT: 0,
  }))
}

// Target button center in canvas-local coordinates (both rects re-read live, so layout shifts track).
function targetCenter() {
  const c = cv.value, b = target.value
  if (!c || !b) return null
  const cr = c.getBoundingClientRect(), br = b.getBoundingClientRect()
  return { x: br.left + br.width / 2 - cr.left, y: br.top + br.height / 2 - cr.top }
}

// easeOutBack:值先冲过 1(过冲)再回 1 —— 论文提笔弧 80%+ 过冲的 UI 化(§0)
function easeOutBack(u) {
  const c1 = 1.70158, c3 = c1 + 1
  return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2
}
// Quadratic bezier at parameter t; the arc state may pass t > 1 (from the ease overshoot),
// which extrapolates past the endpoint - that is the visible overshoot beyond the target.
function bez(p0, p1, p2, t) {
  const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t
  return { x: a * p0.x + b * p1.x + c * p2.x, y: a * p0.y + b * p1.y + c * p2.y }
}

function recruit(now) {
  const to = targetCenter()
  if (!to) return
  // 距目标最近的 8 个漂移粒子出发;控制点在垂直方向侧偏 → 弧线
  const cand = parts.filter(p => p.state === 'drift')
    .sort((a, b) => Math.hypot(a.x - to.x, a.y - to.y) - Math.hypot(b.x - to.x, b.y - to.y))
    .slice(0, 8)
  cand.forEach((p, i) => {
    const d = Math.hypot(to.x - p.x, to.y - p.y) || 1
    const side = (i % 2 ? 1 : -1)
    p.state = 'arc'
    p.arc = {
      p0: { x: p.x, y: p.y },
      p1: {
        x: (p.x + to.x) / 2 - (to.y - p.y) / d * side * d * 0.45,
        y: (p.y + to.y) / 2 + (to.x - p.x) / d * side * d * 0.45,
      },
      p2: { ...to },
      // 26ms departure stagger per particle so arcs do not move as one rigid swarm
      t0: now + i * 26,
      dur: 560 + Math.random() * 160,
    }
  })
}

function draw(now) {
  const c = cv.value
  if (!c) return
  const { ctx, W, H } = setupCanvas(c)
  const to = targetCenter()
  for (const p of parts) {
    if (p.state === 'arc' && p.arc) {
      const u = Math.min(1.25, (now - p.arc.t0) / p.arc.dur)
      if (u < 0) continue
      const e = easeOutBack(Math.min(1, u)) // u 到 1 后 ease 值 ≥1 过冲再回落
      const pos = bez(p.arc.p0, p.arc.p1, p.arc.p2, Math.min(1.15, e))
      p.x = pos.x; p.y = pos.y
      if (u >= 1.25) { p.state = 'orbit'; p.orbitT = now }
    } else if (p.state === 'orbit') {
      // Orbit phase: circle the target with a breathing radius for ~1.6s, then re-enter drift.
      const a = now * 0.006 + p.r * 3
      const r = 30 + 14 * Math.sin(now * 0.003 + p.r * 7)
      if (to && now - p.orbitT < 1600) {
        p.x = to.x + Math.cos(a) * r
        p.y = to.y + Math.sin(a) * r
      } else {
        p.state = 'drift'
        p.vx = (Math.random() - 0.5) * 0.5
        p.vy = (Math.random() - 0.5) * 0.5
      }
    } else {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0 || p.x > W) p.vx *= -1
      if (p.y < 0 || p.y > H) p.vy *= -1
    }
    const active = p.state !== 'drift'
    ctx.fillStyle = active ? rgba(ACCENT, 0.95) : rgba(LINK, 0.5)
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r + (active ? 1.2 : 0), 0, Math.PI * 2)
    ctx.fill()
    if (active) {
      ctx.fillStyle = rgba(ACCENT, 0.18)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function resize() {
  const c = cv.value
  setup(c.clientWidth, c.clientHeight)
  if (signal.state.reduced || !props.active) draw(performance.now())
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  if (!props.active || signal.state.reduced) return
  unsubFire = onFire(ev => {
    if (ev.el === target.value) recruit(ev.t)
  })
  unsubFrame = onFrame(now => draw(now))
})
onBeforeUnmount(() => {
  unsubFire()
  unsubFrame()
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <div class="arc">
    <canvas ref="cv" class="arc-cv" aria-hidden="true"></canvas>
    <button ref="target" v-tuned="'cta'" class="btn primary arc-target">{{ t('lab.arcTarget') }}</button>
  </div>
</template>

<style scoped>
.arc {
  position: relative; height: 280px; border-radius: 12px; overflow: hidden;
  background: var(--bg-1); border: 1px solid var(--line);
}
.arc-cv { position: absolute; inset: 0; width: 100%; height: 100%; }
.arc-target {
  position: absolute; right: clamp(1rem, 8%, 4rem); top: 50%; transform: translateY(-50%);
  box-shadow: 0 0 calc(24px * var(--exc, 0)) rgba(56, 214, 255, calc(0.5 * var(--exc, 0)));
}
.arc-target[data-predicted] { outline: 1px dashed var(--accent); outline-offset: 4px; }
</style>
