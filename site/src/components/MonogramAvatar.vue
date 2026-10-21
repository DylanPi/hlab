<script setup>
// ===== MonogramAvatar — art placeholder avatar for members without a photo =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Props: name - a {zh,en} object or plain string. Renders the surname monogram (zh:
// first character of the surname; en: initials like "YH") on a gradient plate with a
// warm hand-stroke SVG accent echoing the "written stroke" identity. Decorative
// (aria-hidden). Consumed by PersonCard as the no-photo fallback.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { tx } from '../utils/tx'

const props = defineProps({
  // {zh,en} 双语姓名对象，或纯字符串
  name: { type: [Object, String], required: true },
})

const { locale } = useI18n()

// 中文取姓氏单字（郝）；英文取姓名首字母缩写（YH）
const initial = computed(() => {
  const full = tx(props.name)
  if (locale.value === 'zh') return full.trim().charAt(0)
  const parts = full.trim().split(/\s+/)
  return parts.length > 1
    ? parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase()
    : full.charAt(0).toUpperCase()
})
</script>

<template>
  <div class="mono-avatar" aria-hidden="true">
    <span class="ma-initial">{{ initial }}</span>
    <svg class="ma-stroke" viewBox="0 0 120 26" preserveAspectRatio="none">
      <path d="M6 18 C 30 6, 52 24, 74 12 S 108 16, 114 8" fill="none" />
    </svg>
  </div>
</template>

<style scoped>
.mono-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(85% 70% at 30% 20%, rgba(56, 214, 255, 0.12), transparent 70%),
    radial-gradient(70% 60% at 80% 90%, rgba(124, 140, 255, 0.1), transparent 70%),
    linear-gradient(160deg, #16223c, #0b1220);
}
/* Signal ring behind the monogram + a single warm dot on the orbit. */
.mono-avatar::before {
  content: ""; position: absolute; width: 104px; height: 104px; border-radius: 50%;
  border: 1px solid rgba(56, 214, 255, 0.14);
  box-shadow: inset 0 0 40px rgba(56, 214, 255, 0.06), 0 0 30px rgba(56, 214, 255, 0.05);
}
.mono-avatar::after {
  content: ""; position: absolute; width: 5px; height: 5px; border-radius: 50%;
  background: var(--warm); box-shadow: 0 0 10px rgba(255, 180, 92, 0.65);
  left: calc(50% + 34px); top: calc(50% - 38px);
}
.ma-initial {
  position: relative; z-index: 1;
  font-family: var(--font-serif);
  font-size: clamp(2.2rem, 4.5vw, 3.2rem);
  font-weight: 900;
  letter-spacing: 0.02em;
  background: var(--grad);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 14px rgba(56, 214, 255, 0.25));
}
.ma-stroke {
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: 16%;
  height: 22px;
  opacity: 0.8;
  z-index: 1;
}
.ma-stroke path {
  stroke: var(--warm);
  stroke-width: 2.5;
  stroke-linecap: round;
  opacity: 0.75;
}
</style>
