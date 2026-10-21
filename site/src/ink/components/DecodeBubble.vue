<script setup>
// ===== DecodeBubble - DTW decode result card with green warp-alignment lines (sec.7, fig 5b) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: no runtime subscription at all - watch(result) redraws once per decode;
// reduced-motion only disables the CSS pop-in (sec.3). Point sets arrive decoder-normalized
// (bbox, aspect-preserving); map() pads them into the fixed 260px square.
// R6 DecodeBubble(§7,图 5b):解码结果 + 你的笔迹↔模板的绿色对齐连线 + conf%。
// 纯静态渲染(watch result 重绘一次),入场动画交给 CSS(reduced 下关闭)。
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { setupCanvas } from '../utils/canvas'
import { ACCENT, WARM, rgba } from '../../theme'

const props = defineProps({ result: Object })
const { t } = useI18n()
const cv = ref(null)

// Single redraw per new result - no per-frame loop in this component.
watch(() => props.result, r => r && draw(r), { immediate: true })

function draw(r) {
  const c = cv.value
  if (!c || !r) return
  const S = 260
  const { ctx } = setupCanvas(c, S, S)
  const P = 22
  const map = p => [P + p[0] * (S - P * 2), P + p[1] * (S - P * 2)]
  // 绿色对齐连线(先画,垫底):用户点 ↔ 模板点
  ctx.strokeStyle = 'rgba(96,224,150,0.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (const w of r.warping || []) {
    const [ux, uy] = map([w.u[0], w.u[1]])
    const [tx, ty] = map([w.t[0], w.t[1]])
    ctx.moveTo(ux, uy)
    ctx.lineTo(tx, ty)
  }
  ctx.stroke()
  // 模板:青色细线(系统回应)
  ctx.strokeStyle = rgba(ACCENT, 0.75)
  ctx.lineWidth = 2
  ctx.beginPath()
  ;(r.tplPts || []).forEach((p, i) => {
    const [x, y] = map(p)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.stroke()
  // 用户笔迹:暖色粗线(用户侧)
  ctx.strokeStyle = rgba(WARM, 0.95)
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ;(r.userPts || []).forEach((p, i) => {
    const [x, y] = map(p)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.stroke()
}
</script>

<template>
  <div v-if="result" class="bubble" :key="result.char + result.conf">
    <div class="canvas-wrap"><canvas ref="cv" class="db-cv"></canvas></div>
    <div class="meta">
      <span class="char">{{ result.char }}</span>
      <span class="conf mono">{{ Math.round(result.conf * 100) }}% {{ t('lab.conf') }}</span>
      <span class="legend mono">
        <i class="sw warm"></i>{{ t('lab.legendUser') }}
        <i class="sw accent"></i>{{ t('lab.legendTpl') }}
        <i class="sw green"></i>{{ t('lab.legendWarp') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.bubble {
  display: flex; gap: 1.2rem; align-items: center; flex-wrap: wrap;
  background: var(--bg-1); border: 1px solid var(--line); border-radius: 12px;
  padding: 1rem 1.2rem; animation: pop 0.35s ease;
}
@keyframes pop { from { transform: scale(0.94); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .bubble { animation: none; } }
.db-cv { width: 260px; height: 260px; background: var(--bg-2); border-radius: 8px; }
.meta { display: flex; flex-direction: column; gap: 0.6rem; }
.char { font-size: 3.2rem; font-family: var(--font-serif); line-height: 1; }
.conf { color: var(--accent); font-size: 1rem; }
.legend { font-size: 0.72rem; color: var(--ink-dim); display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
.sw { width: 10px; height: 3px; border-radius: 2px; display: inline-block; }
.sw.warm { background: #ffb45c; }
.sw.accent { background: #38d6ff; }
.sw.green { background: #60e096; }
</style>
