<script setup>
// ===== SignalMonitor - 5-channel oscilloscope: Vxy/Vz/P/G traces + M gain bars (L0 live doc, sec.10.2) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: subscribes onFrame/onFire + CSS vars only (UI-FRAMEWORK sec.5/sec.7). Degrades to one static frame when reduced/flag-off (sec.3).
// One Float32Array ring buffer per lane, N=260 samples (~4.3s at 60fps); a single shared `head`
// index is the next write slot for all lanes. Traces read oldest-first so "now" is the right edge.
// DOM readouts are throttled to one update per 120ms (~8Hz) instead of per frame.
// 五通道信号监视器(L0 活体文档,§10.2):Vxy/Vz/P/G/M 五条实时曲线 + 数值读数。
// 曲线挂在 runtime 的同一 rAF(onFrame);降级态(reduced / flag off / disabled)
// 下不订阅、绘一帧静态底线并显示徽标(§3 降级表:循环停转)。
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onFrame } from '../runtime'
import { useIntentSignal } from '../signal'
import { setupCanvas } from '../utils/canvas'
import { ACCENT, WARM, rgba } from '../../theme'

const props = defineProps({ active: Boolean }) // active=false → 降级静态显示
const { t } = useI18n()
const signal = useIntentSignal()
const cv = ref(null)

const N = 260 // 采样环长(~4.3s @60fps)
const lanes = [
  { key: 'vxy', get: f => Math.min(1, f.speed / 30), warm: true, fmt: v => (v * 30).toFixed(1) + ' px/f' },
  { key: 'vz', get: f => f.altitude, warm: true, fmt: v => v.toFixed(2) },
  { key: 'p', get: f => f.pressure, warm: true, fmt: v => v.toFixed(2) },
  { key: 'g', get: f => f.grip, warm: true, fmt: v => v.toFixed(2) },
  { key: 'm', get: () => null, warm: false, fmt: () => '' }, // M 画增益棒,不进环
]
const rings = lanes.map(() => new Float32Array(N))
let head = 0
let unsub = () => {}
const readouts = ref(['', '', '', '', ''])
let lastTextT = 0

function push(f) {
  // Ring write: all lanes share one slot index; `head` always points at the oldest sample.
  for (let i = 0; i < lanes.length; i++) rings[i][head] = lanes[i].get(f) ?? 0
  head = (head + 1) % N
}

function draw() {
  const c = cv.value
  if (!c) return
  const LH = 44
  const { ctx, W } = setupCanvas(c, c.clientWidth, LH * lanes.length)
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace'
  for (let li = 0; li < lanes.length; li++) {
    const y0 = li * LH
    // 通道名 + 当前值
    ctx.fillStyle = 'rgba(159,176,202,0.9)'
    ctx.fillText(laneLabel(li), 8, y0 + 14)
    ctx.strokeStyle = 'rgba(120,150,200,0.12)'
    ctx.beginPath()
    ctx.moveTo(0, y0 + LH - 10.5)
    ctx.lineTo(W, y0 + LH - 10.5)
    ctx.stroke()
    if (li === 4) { drawGains(ctx, y0, LH); continue }
    // 曲线(用户信号=暖,M=青;双色律)
    ctx.strokeStyle = lanes[li].warm ? rgba(WARM, 0.85) : rgba(ACCENT, 0.85)
    ctx.lineWidth = 1.4
    ctx.beginPath()
    const ring = rings[li]
    for (let k = 0; k < N; k++) {
      // (head + k) % N walks oldest -> newest; k maps to x left -> right, so the wave scrolls.
      const v = ring[(head + k) % N]
      const x = (k / (N - 1)) * W
      const y = y0 + LH - 12 - v * (LH - 24)
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

function drawGains(ctx, y0, LH) {
  const gs = [signal.gains.v, signal.gains.g, signal.gains.alt, signal.gains.p]
  const labels = ['v', 'g', 'alt', 'p']
  const W = cv.value.clientWidth
  const x0 = 60, span = W - x0 - 12
  for (let i = 0; i < 4; i++) {
    const cx = x0 + (i + 0.5) * (span / 4)
    const h = ((gs[i] - 0.85) / 0.3) * 22 + 2 // 0.85–1.15 → 2–24px
    ctx.fillStyle = rgba(ACCENT, 0.75)
    ctx.fillRect(cx - 14, y0 + LH - 12 - h, 28, h)
    ctx.fillStyle = 'rgba(159,176,202,0.9)'
    ctx.fillText(`${labels[i]} ×${gs[i].toFixed(2)}`, cx - 16, y0 + 26)
  }
}

function laneLabel(i) {
  return t(`lab.ch${lanes[i].key}`)
}

function loop(now) {
  push(signal.frame)
  if (now - lastTextT > 120) {
    lastTextT = now
    const f = signal.frame
    const g = signal.gains
    readouts.value = [
      `${t('lab.chvxy')} ${f.speed.toFixed(1)} px/f`,
      `${t('lab.chvz')} ${f.altitude.toFixed(2)}`,
      `${t('lab.chp')} ${f.pressure.toFixed(2)}`,
      `${t('lab.chg')} ${f.grip.toFixed(2)}`,
      `${t('lab.chm')} v×${g.v.toFixed(2)} g×${g.g.toFixed(2)} p×${g.p.toFixed(2)}`,
    ]
  }
  draw()
}

onMounted(() => {
  // 挂进 runtime 同一 rAF 循环(§2 一个循环,一份群体状态);降级态绘一帧静态
  if (props.active) unsub = onFrame(loop)
  else draw()
})
onBeforeUnmount(() => unsub())
</script>

<template>
  <div class="monitor">
    <canvas ref="cv" class="mon-cv" aria-hidden="true"></canvas>
    <div class="mon-reads mono" aria-live="off">
      <span v-for="(r, i) in readouts" :key="i" class="mono">{{ r }}</span>
    </div>
  </div>
</template>

<style scoped>
.monitor { background: var(--bg-1); border: 1px solid var(--line); border-radius: 12px; padding: 0.6rem 0.4rem 0.4rem; }
.mon-cv { width: 100%; height: 220px; display: block; }
.mon-reads {
  display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem;
  font-size: 0.72rem; color: var(--ink-dim); padding: 0.45rem 0.8rem 0.3rem;
  border-top: 1px solid var(--line);
}
</style>
