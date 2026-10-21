<script setup>
// ===== FieldWave - R5 field-potential background wave; consumes only the global --field/--field-firing CSS vars (sec.7) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: background readouts read global CSS variables, never runtime JS state (sec.5);
// subscribes onFrame only to advance the wave phase. Degrades to one static frame when reduced/flag-off (sec.3).
// Quiet field = slow large swell; high-frequency interaction = fast choppy wave (field-potential metaphor).
// R5 场电位背景(§7):背景类读出只消费全局 --field / --field-firing 两个 CSS 变量
// (§5 约定:不读 JS 状态)。安静=慢大波,高频交互=快碎波(场电位隐喻)。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { onFrame } from '../runtime'
import { useIntentSignal } from '../signal'
import { setupCanvas } from '../utils/canvas'
import { ACCENT, rgba } from '../../theme'

const props = defineProps({ active: Boolean })
const signal = useIntentSignal()
const cv = ref(null)
let unsub = () => {}
let phase = 0

// This per-frame computed-style read IS the whole coupling surface: the runtime keeps the custom
// properties updated, so this component needs no runtime import for state (sec.5 decoupling).
function fieldVars() {
  const cs = getComputedStyle(document.documentElement)
  return {
    f: parseFloat(cs.getPropertyValue('--field')) || 0,
    fr: parseFloat(cs.getPropertyValue('--field-firing')) || 0,
  }
}

function draw(now, dt) {
  const c = cv.value
  if (!c) return
  const { ctx, W, H } = setupCanvas(c)
  const { f, fr } = fieldVars()
  const mid = H / 2
  // 频率/幅度/毛刺由 --field 插值:慢大波 ↔ 快碎波
  const speed = 0.00035 + f * 0.0028 + fr * 0.004
  phase += dt * speed
  const amp = H * (0.34 - 0.2 * f)
  const k1 = 2 * Math.PI / W
  const jit = f * 0.5 + fr
  ctx.lineWidth = 1.5
  for (const pass of [[6, 0.14], [1.5, 0.72]]) { // 2026-10-06 视觉 QA:主 pass 0.55→0.72,深底上辨识度不足
    ctx.strokeStyle = rgba(ACCENT, pass[1])
    ctx.lineWidth = pass[0] === 6 ? 5 : 1.5
    ctx.beginPath()
    for (let x = 0; x <= W; x += 3) {
      const u = x * k1
      const y = mid
        + Math.sin(u * 1.2 + phase) * amp
        + Math.sin(u * 2.7 - phase * 1.9 + 1.3) * amp * (0.35 + 0.3 * f)
        + Math.sin(x * 0.11 + phase * 7.3) * amp * 0.14 * jit
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

onMounted(() => {
  // reduced / flag off:绘一帧慢大波静态(循环停转,§3)
  if (props.active && !signal.state.reduced) unsub = onFrame((now, dt) => draw(now, dt))
  else draw(0, 16)
})
onBeforeUnmount(() => unsub())
</script>

<template>
  <canvas ref="cv" class="field-wave" aria-hidden="true"></canvas>
</template>

<style scoped>
.field-wave { width: 100%; height: 150px; display: block; }
</style>
