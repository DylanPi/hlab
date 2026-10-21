<script setup>
// ===== InkLayer - R1 warm ink trail + R2 discharge dots render engine (sec.7, fig 3b/c and 1e) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: subscribes onFrame/onFire + CSS vars only (UI-FRAMEWORK sec.5/sec.7). Degrades to one static frame when reduced/flag-off (sec.3).
// Pure renderer, no pointer handling: the host (InkPad) drives it via defineExpose begin/extend/end;
// fire events come back in as discharge(x, y) dots. The onFrame subscription is lazy - started by the
// first stroke/dot, self-cancelled once everything has faded (idle costs nothing).
// R1 落墨笔迹 + R2 落墨放电(§7,图 3b/c 与图 1e)
// 纯渲染引擎:由宿主(InkPad)调 begin/extend/end 喂笔迹,onFire 的放电点经 discharge 落墨。
// R1:暖橙发光笔迹;宽 clamp(5−v·0.04, 2, 5)px(慢=重笔);色随速度 warm↔accent;
//     停笔后驻留 1.2s 起 0.6s 淡出(观感 2026-10-06 初调,合计 ~1.8s 同 §7 口径)。
// R2:红色→暖色小点闪现在笔迹上,600ms 衰减。
// 动画挂 runtime 同一 rAF(onFrame);reduced 下由 extend() 同步直绘、无脉冲(§3)。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { onFrame } from '../runtime'
import { useIntentSignal } from '../signal'
import { setupCanvas } from '../utils/canvas'
import { ACCENT, WARM, mixRgb } from '../../theme'

const props = defineProps({ active: Boolean })
const signal = useIntentSignal()
const cv = ref(null)

// strokes: [{pts:[{x,y,v,t}], lastT}]  dots: [{x,y,t0}]
let strokes = []
let dots = []
let unsub = () => {}
const reduced = signal.state.reduced

// 落墨放电起点红 #ff5c5c(R2 红→暖衰减的暖端用 WARM)
const DISCHARGE_RED = { r: 255, g: 92, b: 92 }

function draw(now) {
  const c = cv.value
  if (!c) return
  const { ctx, W, H } = setupCanvas(c)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 笔迹:按(宽,色,透明)三维量化分桶批量描线(A 线同款思路;数百段 → 几十次 stroke),
  // 每桶两 pass:先加宽低透明的辉光层,再核心层
  const buckets = new Map()
  strokes = strokes.filter(s => {
    const age = now - s.lastT
    const alpha = age < 1200 ? 1 : Math.max(0, 1 - (age - 1200) / 600)
    if (alpha <= 0) return false
    for (let i = 1; i < s.pts.length; i++) {
      const a = s.pts[i - 1], b = s.pts[i]
      const u = Math.min(1, (b.v || 0) / 22) // v≈22px/帧 时已全青
      const w = clamp(5 - (b.v || 0) * 0.04, 2, 5)
      // Bit-packed bucket key, 8 bits total: [7:4] width in 0.5px steps, [3:2] speed-color quantile,
      // [1:0] fade-alpha quantile. Segments sharing a key share one stroke() call in both passes below.
      const key = (Math.round(w * 2) << 4) | ((Math.min(3, (u * 4) | 0)) << 2) | Math.min(3, (alpha * 4) | 0)
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(a.x, a.y, b.x, b.y)
    }
    return true
  })
  for (const [key, arr] of buckets) {
    const w = (key >> 4) / 2
    // 色 warm→accent 随速度插值(慢=暖,快=青;u 分桶中值)
    const [r, g, b] = mixRgb(WARM, ACCENT, (((key >> 2) & 3) + 0.5) / 4)
    const aQ = ((key & 3) + 0.5) / 4
    for (const pass of [[w + 4.5, 0.16], [w, 1]]) {
      ctx.lineWidth = pass[0]
      ctx.strokeStyle = `rgba(${r},${g},${b},${(aQ * pass[1]).toFixed(3)})`
      ctx.beginPath()
      for (let k = 0; k < arr.length; k += 4) {
        ctx.moveTo(arr[k], arr[k + 1])
        ctx.lineTo(arr[k + 2], arr[k + 3])
      }
      ctx.stroke()
    }
  }

  // R2 落墨放电:红 #ff5c5c → 暖 #ffb45c,600ms 衰减(图 1e 红点落墨)
  dots = dots.filter(d => now - d.t0 < 600)
  for (const d of dots) {
    const u = (now - d.t0) / 600
    const g = Math.round(DISCHARGE_RED.g + (WARM.g - DISCHARGE_RED.g) * u)
    ctx.fillStyle = `rgba(255,${g},92,${(0.95 * (1 - u)).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(d.x, d.y, 4 - 2.2 * u, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(255,${g},92,${(0.25 * (1 - u)).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(d.x, d.y, 8 - 5 * u, 0, Math.PI * 2)
    ctx.fill()
  }
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v }

function tick(now) {
  draw(now)
  // 内容全淡出且无放电点 → 退出订阅(空载零成本)
  if (strokes.length === 0 && dots.length === 0) unsubFrame()
}

let subscribed = false
function ensureSubscribed() {
  if (subscribed || reduced || !props.active) return
  subscribed = true
  unsub = onFrame(tick)
}
function unsubFrame() {
  if (subscribed) { unsub(); subscribed = false }
}

defineExpose({
  // Bounded history: at most 24 finished strokes (oldest dropped) and 420 points per stroke
  // (head of the stroke trimmed by 60 when exceeded) so long sessions cannot grow memory unbounded.
  begin(x, y, v) {
    strokes.push({ pts: [{ x, y, v: v || 0, t: performance.now() }], lastT: performance.now() })
    if (strokes.length > 24) strokes.shift()
    ensureSubscribed()
    if (subscribed) draw(performance.now())
  },
  extend(x, y, v) {
    const s = strokes[strokes.length - 1]
    if (!s) return
    s.pts.push({ x, y, v: v || 0, t: performance.now() })
    if (s.pts.length > 420) s.pts.splice(0, 60)
    s.lastT = performance.now()
    if (reduced || !subscribed) draw(performance.now()) // reduced:同步直绘,无脉冲
  },
  end() { /* 停笔:淡出计时从 lastT 起算,无需处理 */ },
  discharge(x, y) {
    dots.push({ x, y, t0: performance.now() })
    if (dots.length > 80) dots.shift()
    ensureSubscribed()
    if (reduced) draw(performance.now())
  },
  clear() {
    strokes = []
    dots = []
    draw(performance.now())
  },
})

onMounted(() => {
  if (reduced || !props.active) draw(performance.now())
})
onBeforeUnmount(() => unsubFrame())
</script>

<template>
  <canvas ref="cv" class="ink-cv"></canvas>
</template>

<style scoped>
.ink-cv { position: absolute; inset: 0; width: 100%; height: 100%; }
</style>
