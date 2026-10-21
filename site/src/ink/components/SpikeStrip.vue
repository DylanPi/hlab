<script setup>
// ===== SpikeStrip - R4 firing raster: 18 rows x 6s scrolling window (sec.7, fig 1b) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: subscribes onFrame/onFire + CSS vars only (UI-FRAMEWORK sec.5/sec.7). Degrades to one static frame when reduced/flag-off (sec.3).
// Each fire event appends a tick {row, t}; "now" is the right edge of the canvas, ticks scroll left
// with age and expire at 6s. At most 400 ticks are retained.
// R4 SpikeStrip 放电条(§7,图 1b raster):18 行刻度带,每行对应一组神经元,
// 发放(fire 事件)时在该行落一个点,6s 时间窗随时间左移。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { onFire, onFrame } from '../runtime'
import { useIntentSignal } from '../signal'
import { setupCanvas } from '../utils/canvas'
import { ACCENT, rgba } from '../../theme'

const props = defineProps({ active: Boolean })
const signal = useIntentSignal()
const cv = ref(null)

const ROWS = 18
const WINDOW = 6000
let ticks = [] // {row, t} 上限 400
let unsubFire = () => {}
let unsubFrame = () => {}

function draw(now) {
  const c = cv.value
  if (!c) return
  const { ctx, W, H } = setupCanvas(c)
  const lh = H / ROWS
  // 行基线(极淡)
  ctx.strokeStyle = 'rgba(120,150,200,0.10)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let r = 0; r < ROWS; r++) {
    const y = Math.round((r + 1) * lh) + 0.5
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
  }
  ctx.stroke()
  // 发放点:新生 140ms 高亮弹出,随窗龄左移淡出
  ticks = ticks.filter(k => now - k.t < WINDOW)
  for (const k of ticks) {
    const age = now - k.t
    const x = W - (age / WINDOW) * W
    const y = k.row * lh + lh / 2
    const a = age < 140 ? 1 : Math.max(0.15, 0.9 * (1 - age / WINDOW))
    const h = age < 140 ? lh * 0.9 : lh * 0.62
    ctx.fillStyle = rgba(ACCENT, a.toFixed(3))
    ctx.fillRect(x - 1, y - h / 2, 2, h)
  }
  // 「现在」边线
  ctx.fillStyle = rgba(ACCENT, 0.4)
  ctx.fillRect(W - 1, 0, 1, H)
}

onMounted(() => {
  if (!props.active || signal.state.reduced) {
    draw(performance.now())
    return
  }
  unsubFire = onFire(ev => {
    // id % ROWS: many-to-one hash of neuron id onto rows
    ticks.push({ row: ev.id % ROWS, t: ev.t })
    if (ticks.length > 400) ticks.shift()
  })
  unsubFrame = onFrame(now => draw(now))
})
onBeforeUnmount(() => {
  unsubFire()
  unsubFrame()
})
</script>

<template>
  <canvas ref="cv" class="spike-strip" aria-hidden="true"></canvas>
</template>

<style scoped>
.spike-strip { width: 100%; height: 168px; display: block; }
</style>
