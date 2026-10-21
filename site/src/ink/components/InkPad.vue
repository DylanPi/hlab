<script setup>
// ===== InkPad - pen-down capture pad; the pen tip doubles as a mobile inkDot neuron =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: subscribes onFrame/onFire + CSS vars only (UI-FRAMEWORK sec.5/sec.7).
// Degradation (sec.3): with the flag off, pointer capture still works and InkLayer still draws
// statically, but the mobile-neuron registration and the R2 discharge subscription are skipped.
// Stroke capture: pointer events -> points with pressure/velocity; emits ('stroke', {pts, dur})
// with raw pad-local coordinates (normalization belongs to the decoders, see onUp).
// InkPad 触摸写字板(INTERACTION-PLAN B1 移入框架,§10.1)
// pen-down 的显式入口(触屏设备唯一入口,§3 降级表);采集带压力/速度的笔迹:
//  - 渲染走内嵌 InkLayer(R1 笔迹 + R2 落墨放电)
//  - 笔尖注册为移动 inkDot 神经元(runtime.registerMobileNeuron),
//    压力积累越阈发放 → R2 红点(与元素神经元同一事件总线)
//  - 每完成一笔 emit('stroke', 归一化点列)供 dtw/gesture 解码
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import InkLayer from './InkLayer.vue'
import { onFire, registerMobileNeuron, unregisterMobileNeuron } from '../runtime'
import { PROFILES } from '../profiles'

const props = defineProps({ active: Boolean, compact: Boolean })
const emit = defineEmits(['stroke'])
const { t } = useI18n()
const pad = ref(null)
const layer = ref(null)
const writing = ref(false)

let cur = null        // 当前笔迹 {pts:[{x,y,p,v}], t0}
let lastPt = null
let mobileNeuron = null
let padRect = null
let unsubFire = () => {}

function localPt(e) {
  return { x: e.clientX - padRect.left, y: e.clientY - padRect.top }
}

function onDown(e) {
  e.preventDefault()
  pad.value.setPointerCapture(e.pointerId)
  padRect = pad.value.getBoundingClientRect()
  const pt = localPt(e)
  // Mice report no meaningful pressure (constant 0.5) - substitute a fixed value; touch/pen use hardware.
  const p = e.pointerType === 'mouse' ? 0.6 : (e.pressure || 0.5)
  cur = { pts: [{ ...pt, p, v: 0 }], t0: performance.now() }
  lastPt = { ...pt, t: performance.now() }
  writing.value = true
  layer.value?.begin(pt.x, pt.y, 0)
  // 笔尖 inkDot 神经元:跟随笔尖,只吃压力(§4.1 档案)
  if (props.active) {
    mobileNeuron = registerMobileNeuron(
      () => ({ cx: padRect.left + lastPt.x, cy: padRect.top + lastPt.y }),
      { ...PROFILES.inkDot },
    )
  }
}

function onMove(e) {
  if (!cur) return
  const pt = localPt(e)
  const now = performance.now()
  const dt = Math.max(1, now - lastPt.t)
  // Velocity in px per 16.67ms frame - the unit InkLayer's width/speed-color law expects.
  const v = Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) / (dt / 16.67) // px/帧
  if (Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) < 2) return // 2px 以下并点
  const p = e.pointerType === 'mouse' ? 0.6 : (e.pressure || 0.5)
  cur.pts.push({ ...pt, p, v })
  layer.value?.extend(pt.x, pt.y, v)
  lastPt = { ...pt, t: now }
}

function onUp() {
  if (!cur) return
  layer.value?.end()
  writing.value = false
  if (mobileNeuron) { unregisterMobileNeuron(mobileNeuron); mobileNeuron = null }
  // Minimum 4 points: shorter sequences are taps/noise, not writing worth decoding.
  if (cur.pts.length >= 4) {
    // 发射原始本地坐标:归一化是解码器的事(dtw 对多笔字整体归一,
    // gesture 按自身 bbox 拉伸——pad 的 3.7:1 像素横纵比会压扁对角线)
    emit('stroke', { pts: cur.pts.map(q => ({ x: q.x, y: q.y })), dur: performance.now() - cur.t0 })
  }
  cur = null
}

function clear() {
  layer.value?.clear()
}

onMounted(() => {
  // R2 放电点:移动神经元发放 → 换算回 pad 本地坐标落墨
  if (props.active) {
    unsubFire = onFire(ev => {
      if (!ev.mobile || !ev.profile.includes('inkDot')) return
      if (!padRect) padRect = pad.value.getBoundingClientRect()
      layer.value?.discharge(ev.x - padRect.left, ev.y - padRect.top)
    })
  }
})
onBeforeUnmount(() => {
  unsubFire()
  if (mobileNeuron) unregisterMobileNeuron(mobileNeuron)
})
</script>

<template>
  <div class="inkpad-wrap">
    <div
      ref="pad"
      class="inkpad"
      :class="{ writing, compact }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <InkLayer ref="layer" :active="active" />
      <span class="pad-hint mono" :class="{ hide: writing }">{{ t('lab.padHint') }}</span>
    </div>
    <div v-if="!compact" class="pad-bar">
      <button class="btn ghost small" @click="clear">{{ t('lab.clear') }}</button>
      <span class="pad-note">{{ t('lab.padNote') }}</span>
    </div>
  </div>
</template>

<style scoped>
.inkpad-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
.inkpad {
  position: relative; height: clamp(220px, 34vh, 320px);
  background:
    radial-gradient(60% 80% at 50% 0%, rgba(255, 180, 92, 0.05), transparent 70%),
    var(--bg-1);
  border: 1px solid var(--line); border-radius: 12px;
  touch-action: none; cursor: crosshair; overflow: hidden;
}
.inkpad.compact { height: 150px; }
.inkpad.writing { border-color: rgba(255, 180, 92, 0.45); }
.pad-hint {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  color: var(--ink-dim); opacity: 0.92; font-size: 0.85rem; letter-spacing: 0.12em;
  pointer-events: none; transition: opacity 0.3s;
}
.pad-hint.hide { opacity: 0; }
.pad-bar { display: flex; align-items: center; gap: 0.9rem; }
.pad-note { color: var(--ink-dim); font-size: 0.76rem; }
</style>
