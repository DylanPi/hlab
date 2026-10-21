<script setup>
// ===== DwellRing - dwell-confirm progress ring; emits 'confirm' at 800ms (conf = 1 - e^(-t/800), trigger >= 0.98) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: subscribes onFrame/onFire + CSS vars only (UI-FRAMEWORK sec.5/sec.7).
// Reduced-motion fallback (sec.3): the rAF loop never starts; the ring fills via a 0.84s CSS
// transition and a one-shot timer confirms via a forced dwell.tick(), so user-initiated
// dwell confirmation survives without pulses.
// R8 DwellRing(§7):环形置信进度(青),充满即触发。§6.1:conf=1−e^(−t/800ms),
// ≥0.98 触发。正常态挂 runtime rAF;reduced 下循环节停转,改走 CSS transition +
// setTimeout(§3:用户主动的驻留确认保留,只是无脉冲)。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createDwell } from '../decoders/dwell'
import { onFrame } from '../runtime'
import { useIntentSignal } from '../signal'

const emit = defineEmits(['confirm'])
const { t } = useI18n()
const signal = useIntentSignal()
const conf = ref(0)
const done = ref(false)

const dwell = createDwell({
  T: 800,
  onConfirm() {
    done.value = true
    emit('confirm')
    setTimeout(() => { done.value = false; conf.value = 0 }, 1800)
  },
})

let unsub = () => {}
let leaveTimer = 0

function onEnter() {
  if (done.value) return
  dwell.enter()
  if (signal.state.reduced) {
    // 降级:环由 CSS transition 填充,conf 由定时器近似
    conf.value = 0
    requestAnimationFrame(() => { conf.value = 0.999 })
    clearTimeout(leaveTimer)
    // +4000ms fake timestamp: tick() then sees the full dwell as elapsed and confirms at ~840ms.
    leaveTimer = setTimeout(() => dwell.tick(performance.now() + 4000), 840)
  }
}
function onLeave() {
  dwell.leave()
  clearTimeout(leaveTimer)
  conf.value = 0
}

onMounted(() => {
  if (!signal.state.reduced) {
    unsub = onFrame(() => { conf.value = dwell.tick() })
  }
})
onBeforeUnmount(() => { unsub(); clearTimeout(leaveTimer) })
</script>

<template>
  <button
    class="dwell-btn"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @focus="onEnter"
    @blur="onLeave"
  >
    <svg class="ring" viewBox="0 0 48 48" aria-hidden="true">
      <circle class="bgc" cx="24" cy="24" r="20" />
      <!-- 125.6 = 2*PI*r (r=20): full ring circumference, dashoffset reveals conf fraction -->
      <circle class="fgc" cx="24" cy="24" r="20"
        :stroke-dasharray="125.6" :stroke-dashoffset="125.6 * (1 - conf)" />
    </svg>
    <span>{{ done ? t('lab.dwellDone') : t('lab.dwellBtn') }}</span>
  </button>
</template>

<style scoped>
.dwell-btn {
  position: relative; display: inline-flex; align-items: center; gap: 0.9rem;
  padding: 0.8rem 1.4rem 0.8rem 1rem; border-radius: 12px; cursor: pointer;
  border: 1px solid rgba(255, 180, 92, 0.4); color: var(--warm); background: var(--bg-2);
  font-size: 0.9rem; transition: border-color 0.2s;
}
.dwell-btn:hover { border-color: var(--warm); }
.ring { width: 34px; height: 34px; transform: rotate(-90deg); flex: none; }
.bgc { fill: none; stroke: rgba(120, 150, 200, 0.2); stroke-width: 4; }
.fgc {
  fill: none; stroke: var(--accent); stroke-width: 4; stroke-linecap: round;
  transition: stroke-dashoffset 0.1s linear;
}
@media (prefers-reduced-motion: reduce) {
  .fgc { transition: stroke-dashoffset 0.84s linear; } /* 降级:直线填充,无脉冲 */
}
</style>
