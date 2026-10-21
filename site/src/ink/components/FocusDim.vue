<script setup>
// ===== FocusDim - R9 center-surround dimming, CSS-only (sec.7) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: zero JS - each card is a v-tuned 'card' neuron; brightness/saturation
// consume only that element's --exc custom property (written by the runtime). Nothing to degrade (sec.3).
// R9 FocusDim(§7):聚焦卡片邻卡降亮度(中心-周围抑制,视觉皮层注意机制)。
// 零 JS:卡片是 card 档案神经元,亮度只消费各自的 --exc。
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="fdim">
    <div v-tuned="'card'" class="fcard">{{ t('lab.focus1') }}</div>
    <div v-tuned="'card'" class="fcard">{{ t('lab.focus2') }}</div>
    <div v-tuned="'card'" class="fcard">{{ t('lab.focus3') }}</div>
  </div>
</template>

<style scoped>
.fdim { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.fcard {
  background: var(--bg-2); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 1.4rem 1.3rem; min-height: 130px; font-size: 0.9rem; color: var(--ink-dim);
  /* 中心-周围抑制:基准保持可读(2026-10-06 视觉 QA:0.55 基准把静态卡片压成
  近全黑),抑制幅度留在 0.35,激发时再抬亮 */
  filter: brightness(calc(0.82 + 0.35 * var(--exc, 0))) saturate(calc(0.8 + 0.35 * var(--exc, 0)));
  border-color: rgba(56, 214, 255, calc(0.14 + 0.5 * var(--exc, 0)));
  transition: filter 0.15s linear;
}
@media (max-width: 640px) { .fdim { grid-template-columns: 1fr; } }
</style>
