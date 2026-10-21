<script setup>
// ===== Galaxy - top-6 similarity rings: best match centered, runners-up on concentric rings (sec.7) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: declarative only - no runtime subscription and no JS state reads;
// reduced-motion needs no handling (sec.3). Rank encodes distance: farther ring = smaller, dimmer.
// R7 Galaxy(§7,图 1f tSNE 邻域的简化示意):最像的字居中,top-6 相似字按距离
// 排成同心环。简化而诚实——不做真实降维(§6.5)。
import { computed } from 'vue'

const props = defineProps({ top6: Array })
const items = computed(() => {
  const list = props.top6 || []
  return list.slice(1).map((it, i) => {
    const ang = (i / Math.max(1, list.length - 2)) * Math.PI * 2 - Math.PI / 2
    const r = 46 + i * 17
    return {
      char: it.char,
      d: it.d,
      x: 50 + Math.cos(ang) * (r / 2.4),
      y: 50 + Math.sin(ang) * (r / 2.4),
      size: 1.5 - i * 0.13,
      op: 0.9 - i * 0.13,
    }
  })
})
</script>

<template>
  <div class="galaxy" v-if="top6?.length">
    <span class="center" :title="`d=${top6[0].d.toFixed(3)}`">{{ top6[0].char }}</span>
    <span
      v-for="(it, i) in items" :key="i" class="sat"
      :style="{ left: it.x + '%', top: it.y + '%', fontSize: it.size + 'rem', opacity: it.op }"
      :title="`d=${it.d.toFixed(3)}`"
    >{{ it.char }}</span>
    <i class="ring r1" aria-hidden="true"></i>
    <i class="ring r2" aria-hidden="true"></i>
  </div>
</template>

<style scoped>
.galaxy {
  position: relative; width: 240px; height: 240px; flex: none;
  background: radial-gradient(50% 50% at 50% 50%, rgba(56, 214, 255, 0.06), transparent 75%);
}
.center {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  font-family: var(--font-serif); font-size: 2.6rem; color: var(--warm);
  text-shadow: 0 0 18px rgba(255, 180, 92, 0.45);
}
.sat {
  position: absolute; transform: translate(-50%, -50%);
  font-family: var(--font-serif); color: var(--ink-dim); cursor: default;
  transition: color 0.2s;
}
.sat:hover { color: var(--accent); }
.ring {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  border: 1px dashed rgba(120, 150, 200, 0.18); border-radius: 50%;
}
.ring.r1 { width: 130px; height: 130px; }
.ring.r2 { width: 196px; height: 196px; }
</style>
