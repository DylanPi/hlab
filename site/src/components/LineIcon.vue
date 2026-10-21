<script setup>
// ===== LineIcon — inline SVG icon dictionary addressed by a name prop =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Single source of the site's line-icon system: 48x48 viewBox, gradient stroke
// (cyan -> violet), warm #ffb45c accent strokes, fill:none outlines. SVG gradient ids
// are document-global, so every instance builds its own <defs> gradient under a
// per-instance uid and rewrites the hardcoded url(#g) references to it (see body).
// Icons are decorative (aria-hidden, not focusable).
import { computed, getCurrentInstance } from 'vue'

// 统一线性图标体系：48×48 viewBox、主渐变描边（神经信号青蓝→紫蓝）、
// 暖色 #ffb45c 点缀（延续“书写的一笔”识别元素），全部 fill: none 线性风格
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 48 },
})

// 每实例独立渐变 id，避免同页多个图标互相引用错 <defs>
const uid = 'li' + (getCurrentInstance()?.uid ?? Math.random().toString(36).slice(2, 7))

const ICONS = {
  // —— 研究方向页 ——
  wave: `<path d="M4 26 L12 26 L17 12 L24 38 L30 20 L35 26 L44 26" stroke="url(#g)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  chip: `<rect x="12" y="12" width="24" height="24" rx="4" stroke="url(#g)" stroke-width="3"/><rect x="20" y="20" width="8" height="8" rx="1.5" fill="url(#g)"/><path d="M18 12V5M30 12V5M18 43v-7M30 43v-7M12 18H5M12 30H5M43 18h-7M43 30h-7" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>`,
  hanzi: `<path d="M14 8v32M6 14h16M8 22c4 3 10 3 13 0M25 8l14 5M32 6v36M25 22c3 8 9 14 14 16M25 30c2-6 5-10 8-13" stroke="url(#g)" stroke-width="2.6" stroke-linecap="round"/>`,
  heart: `<path d="M24 41S6 30 6 17.5C6 11 11 7 16.5 7c3.2 0 6 1.6 7.5 4 1.5-2.4 4.3-4 7.5-4C37 7 42 11 42 17.5 42 30 24 41 24 41z" stroke="url(#g)" stroke-width="3" stroke-linejoin="round"/><path d="M14 18c1.5-2.5 4.5-4 7-3.5" stroke="#ffb45c" stroke-width="2.2" stroke-linecap="round"/>`,
  // —— 首页亮点卡 ——
  pen: `<path d="M31 11 11 31M37 17 17 37M11 31l-3 9 9-3" stroke="url(#g)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 44c7-3.5 13-3.5 20 0" stroke="#ffb45c" stroke-width="2.4" stroke-linecap="round"/>`,
  brain: `<path d="M24 7C17 7 12 11 12 16c-4 1-6 5-4 9-3 3-1 8 3 9 1 4 6 6 10 4 1.5 2 4.5 2 6 0 4 2 9 0 10-4 4-1 6-6 3-9 2-4 0-8-4-9 0-5-5-9-12-9z" stroke="url(#g)" stroke-width="2.6" stroke-linejoin="round"/><path d="M24 15v5M21.5 17.5h5" stroke="#ffb45c" stroke-width="2" stroke-linecap="round"/>`,
  trophy: `<path d="M17 8h14v9a7 7 0 0 1-14 0zM17 12h-7c-2 0-3 1.5-3 3.5C7 18.5 9.5 20.5 13 21M31 12h7c2 0 3 1.5 3 3.5 0 3-2.5 5-6 5.5M24 24v7M17 38h14" stroke="url(#g)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="14" r="2" fill="#ffb45c"/>`,
  // —— 招募岗位卡 ——
  'grad-cap': `<path d="M6 19 24 10l18 9-18 9zM13 23v7c0 3.2 5 5.5 11 5.5s11-2.3 11-5.5v-7M42 19v8" stroke="url(#g)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="42" cy="30" r="2.2" fill="#ffb45c"/>`,
  book: `<path d="M24 13c-5-3.5-11.5-4-16-2.5V37c4.5-1.5 11-1 16 2.5 5-3.5 11.5-4 16-2.5V10.5c-4.5-1.5-11-1-16 2.5zM24 13v26.5" stroke="url(#g)" stroke-width="2.6" stroke-linejoin="round"/><path d="M32 12v7l2.5-2 2.5 2v-7" stroke="#ffb45c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  sprout: `<path d="M24 42V27M24 31c-6 0-10.5-4.5-11.5-11.5 7 .5 11.5 5 11.5 11.5zM24 27c5.5 0 10-4.5 11-11.5-6.5.5-11 5-11 11.5z" stroke="url(#g)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 42h18" stroke="#ffb45c" stroke-width="2.4" stroke-linecap="round"/>`,
  microscope: `<path d="M12 36h16M6 44h36M28 44a14 14 0 1 0 0-28h-2M18 28h4M18 24a4 4 0 0 1-4-4V12h12v8a4 4 0 0 1-4 4zM24 12V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6" stroke="url(#g)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="36" cy="34" r="2" fill="#ffb45c"/>`,
}

const body = computed(() => {
  // Rewrite the shared url(#g) placeholder in each icon's markup to this instance's uid
  const defs = `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stop-color="#38d6ff"/><stop offset="1" stop-color="#7c8cff"/></linearGradient></defs>`
  const paths = (ICONS[props.name] || '').split('url(#g)').join(`url(#${uid})`)
  return defs + paths
})
</script>

<template>
  <svg class="line-icon" :width="size" :height="size" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false" v-html="body"></svg>
</template>

<style>
.line-icon { display: inline-block; vertical-align: middle; flex: none; }
</style>
