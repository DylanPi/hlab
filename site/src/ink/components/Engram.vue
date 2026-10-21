<script setup>
// ===== Engram - R10 visit ink marks on demo links, fading over ~5 minutes (sec.7) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: component-local state only - no runtime subscription, no cross-component
// reads, zero global side effects. Reduced-motion shows marks statically (no fade animation)
// until the 5-minute cleanup removes them (sec.3).
// R10 Engram 墨痕(§7):访问过的演示链接留淡墨痕,随会话淡出(~5 分钟)。
// 路由事件驱动:点击跳本页分区锚点并留痕;纯组件内状态,零全局副作用。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const LINKS = [
  { id: 'lab-signal', key: 'lab.engramL1' },
  { id: 'lab-bench', key: 'lab.engramL2' },
  { id: 'lab-ink', key: 'lab.engramL3' },
  { id: 'lab-decode', key: 'lab.engramL4' },
]
const marks = ref({}) // id -> t0

let cleanTimer = 0
onMounted(() => {
  // 每 30s 清理过期墨痕(~5 分钟淡出窗口的兜底)
  cleanTimer = setInterval(() => {
    const now = Date.now()
    for (const k of Object.keys(marks.value)) {
      if (now - marks.value[k] > 5 * 60 * 1000) delete marks.value[k]
    }
  }, 30000)
})

function go(id) {
  marks.value[id] = Date.now()
  document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' })
}
onBeforeUnmount(() => clearInterval(cleanTimer))
</script>

<template>
  <nav class="engram">
    <a v-for="l in LINKS" :key="l.id" class="elink" @click.prevent="go(l.id)">
      {{ t(l.key) }}
      <i v-if="marks[l.id]" class="mark" aria-hidden="true"></i>
    </a>
  </nav>
</template>

<style scoped>
.engram { display: flex; gap: 1.4rem; flex-wrap: wrap; }
.elink {
  position: relative; color: var(--accent); cursor: pointer;
  font-size: 0.92rem; padding-bottom: 6px;
}
.elink:hover { opacity: 1; }
.mark {
  position: absolute; left: 0; right: 0; bottom: -2px; height: 3px; border-radius: 2px;
  background: linear-gradient(90deg, rgba(255, 180, 92, 0.75), rgba(255, 180, 92, 0.1));
  animation: fadeout 300s linear forwards;
}
@keyframes fadeout { from { opacity: 1; } to { opacity: 0; } }
/* reduced:墨痕静态显示(无渐隐动画;随 5 分钟清理直接移除)。
   原先这里写 animation-duration:300s 与基准相同,是无效规则(H 线修复) */
@media (prefers-reduced-motion: reduce) { .mark { animation: none; } }
</style>
