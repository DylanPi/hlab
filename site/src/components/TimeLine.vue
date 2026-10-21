<script setup>
// ===== TimeLine — vertical milestone list (date / title / description rows) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Props: items - array of {date, title, desc} with {zh,en} fields resolved via tx();
// compact tightens row spacing for dense timelines. Each row uses v-reveal for a
// one-shot scroll-in animation. Consumed by the About/Lab views.
import { tx } from '../utils/tx'

defineProps({
  items: { type: Array, required: true },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <div class="timeline" :class="{ compact }">
    <div v-for="(it, i) in items" :key="i" class="tl-item" v-reveal>
      <div class="tl-node"></div>
      <div class="tl-date mono">{{ it.date }}</div>
      <h3 class="tl-title">{{ tx(it.title) }}</h3>
      <p class="tl-desc">{{ tx(it.desc) }}</p>
    </div>
  </div>
</template>

<style scoped>
.timeline { position: relative; padding-left: 2.2rem; }
.timeline::before {
  content: ""; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 1.5px;
  background: linear-gradient(180deg, rgba(56, 214, 255, 0.75), rgba(124, 140, 255, 0.28), rgba(124, 140, 255, 0.04));
}
.tl-item { position: relative; padding-bottom: 2.4rem; }
.tl-item:last-child { padding-bottom: 0; }
.tl-node {
  position: absolute; left: -2.2rem; top: 5px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--bg-0);
  border: 2px solid rgba(56, 214, 255, 0.65);
  box-shadow: 0 0 0 5px rgba(56, 214, 255, 0.05), 0 0 14px rgba(56, 214, 255, 0.45);
}
.tl-node::after {
  content: ""; position: absolute; inset: 3px; border-radius: 50%;
  background: var(--accent); box-shadow: 0 0 8px rgba(56, 214, 255, 0.8);
}
.tl-date { font-size: 0.78rem; color: var(--accent); letter-spacing: 0.1em; margin-bottom: 0.2rem; }
.tl-title { margin: 0 0 0.35rem; font-size: 1.15rem; }
.tl-desc { margin: 0; color: var(--ink-dim); font-size: 0.94rem; line-height: 1.8; max-width: 720px; }
.timeline.compact .tl-item { padding-bottom: 1.6rem; }
</style>
