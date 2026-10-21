<script setup>
// ===== NewsCard — single news item card (News page and home news section) =====
// [EN header added H-line 2026-10-09; Deep Signal pass 2026-10-20 adds the featured
//  variant, a date dot and a hairline footer.]
// Props: item (data/news.json entry; {zh,en} fields via tx()), featured (wide card on
// the News page). Category (paper/media/honor/lab) maps to a colored tag + i18n label.
// Dates render as YYYY.MM.DD.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { tx } from '../utils/tx'

const props = defineProps({
  item: { type: Object, required: true },
  featured: { type: Boolean, default: false },
})
const { t, locale } = useI18n()

const catClass = { paper: '', media: 'warm', honor: 'purple', lab: '' }
const catKey = { paper: 'catPaper', media: 'catMedia', honor: 'catHonor', lab: 'catLab' }

// English locale prefers an English source name when the data provides one (sourceEn)
const source = computed(() =>
  locale.value === 'en' && props.item.sourceEn ? props.item.sourceEn : props.item.source
)

function fmt(d) {
  return d.replaceAll('-', '.')
}
</script>

<template>
  <article class="news card hov" :class="{ featured }">
    <div class="n-head">
      <span class="n-date mono"><i class="n-dot" aria-hidden="true"></i>{{ fmt(item.date) }}</span>
      <span class="tag" :class="catClass[item.cat]">{{ t('news.' + catKey[item.cat]) }}</span>
    </div>
    <h3 class="n-title">{{ tx(item.title) }}</h3>
    <p class="n-sum">{{ tx(item.summary) }}</p>
    <div class="n-foot">
      <a v-if="item.url" :href="item.url" target="_blank" rel="noopener" class="n-link">
        {{ t('common.readMore') }} <span aria-hidden="true">↗</span>
      </a>
      <span class="n-src">{{ source }}</span>
    </div>
  </article>
</template>

<style scoped>
.news { display: flex; flex-direction: column; padding: 1.5rem 1.55rem; }
.n-head { display: flex; align-items: center; justify-content: space-between; gap: 0.7rem; margin-bottom: 0.8rem; }
.n-date { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.74rem; color: var(--accent); letter-spacing: 0.06em; }
.n-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px rgba(56, 214, 255, 0.7); }
.n-title { margin: 0 0 0.5rem; font-size: 1.04rem; line-height: 1.5; }
.n-sum { margin: 0 0 1rem; font-size: 0.88rem; color: var(--ink-dim); line-height: 1.75; flex: 1; }
.n-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 0.8rem;
  font-size: 0.8rem; padding-top: 0.8rem; border-top: 1px solid var(--line-soft);
}
.n-link { display: inline-flex; align-items: center; gap: 0.25rem; }
.n-link:hover { opacity: 1; text-decoration: underline; text-underline-offset: 3px; }
.n-src { color: var(--ink-faint); opacity: 0.88; text-align: right; }

/* Featured: wider on the News page, with a soft cyan wash and a slightly larger lead. */
.news.featured {
  grid-column: span 2;
  padding: 1.9rem 2rem;
  background:
    radial-gradient(80% 120% at 0% 0%, rgba(56, 214, 255, 0.09), transparent 62%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0) 38%),
    var(--bg-2);
}
.news.featured .n-title { font-size: 1.3rem; line-height: 1.45; }
.news.featured .n-sum { font-size: 0.94rem; max-width: 680px; }
@media (max-width: 620px) {
  .news.featured { grid-column: span 1; padding: 1.5rem 1.55rem; }
  .news.featured .n-title { font-size: 1.15rem; }
}
</style>
