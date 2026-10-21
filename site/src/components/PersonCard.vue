<script setup>
// ===== PersonCard — team member card (People page and home roster) =====
// [EN header added H-line 2026-10-09; Deep Signal pass 2026-10-20 moves the role chip
//  onto the photo and adds a restrained hover zoom.]
// Props: person (data/people.json entry; {zh,en} fields resolved via tx()) and an
// optional role tag label. Members without a photo fall back to MonogramAvatar.
// `since` shows "joined YYYY" / "since YYYY"; a non-empty `until` switches the display
// to an alumni membership range "YYYY-YYYY" (see sinceText below).
import { useI18n } from 'vue-i18n'
import { tx } from '../utils/tx'
import MonogramAvatar from './MonogramAvatar.vue'

const props = defineProps({
  person: { type: Object, required: true },
  role: String,
})
const { t, locale } = useI18n()
// 在读成员显示"XX 年入组"；校友带 until 字段时显示在组区间（如 2019–2024）
const sinceText = (p) => {
  if (p.until) return `${p.since}–${p.until}`
  return locale.value === 'zh' ? `${p.since} 年入组` : `since ${p.since}`
}
</script>

<template>
  <div class="person card hov">
    <div class="photo">
      <img v-if="person.photo" :src="person.photo" :alt="tx(person.name)" loading="lazy" />
      <MonogramAvatar v-else :name="person.name" />
      <span v-if="role" class="role-chip">{{ role }}</span>
    </div>
    <div class="info">
      <h3>{{ tx(person.name) }}</h3>
      <p v-if="person.since" class="since mono">{{ sinceText(person) }}</p>
      <p class="dir">{{ tx(person.dir) || tx(person.desc) }}</p>
      <a v-if="person.homepage" :href="person.homepage" target="_blank" rel="noopener" class="hp">
        {{ t('people.homepage') }} <span aria-hidden="true">↗</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.person { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.photo { position: relative; aspect-ratio: 1 / 0.92; overflow: hidden; background: var(--bg-2); }
.photo img {
  width: 100%; height: 100%; object-fit: cover; object-position: center top;
  transition: transform 0.55s var(--ease-out);
}
.person:hover .photo img { transform: scale(1.035); }
.photo::after {
  content: ""; position: absolute; inset: auto 0 0; height: 48%;
  background: linear-gradient(180deg, transparent, rgba(7, 11, 20, 0.5));
  pointer-events: none;
}
.role-chip {
  position: absolute; top: 0.7rem; left: 0.7rem; z-index: 1;
  padding: 0.2rem 0.6rem; border-radius: var(--r-pill);
  font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.04em;
  color: var(--warm); background: rgba(7, 11, 20, 0.76);
  border: 1px solid rgba(255, 180, 92, 0.32);
}
.info { padding: 1.05rem 1.2rem 1.2rem; }
h3 { margin: 0; font-size: 1.08rem; }
.since { margin: 0.3rem 0 0; font-size: 0.72rem; letter-spacing: 0.04em; color: var(--ink-faint); }
.dir { margin: 0.5rem 0 0; font-size: 0.87rem; line-height: 1.65; color: var(--ink-dim); }
.hp { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; margin-top: 0.7rem; }
@media (prefers-reduced-motion: reduce) {
  .photo img, .person:hover .photo img { transition: none; transform: none; }
}
</style>
