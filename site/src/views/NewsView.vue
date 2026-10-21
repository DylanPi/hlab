<script setup>
// ===== NewsView.vue - Full news list, newest first =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Route: #/news | Data: news.json | i18n: news.*
// Reuses NewsCard (same card as the home teaser). Dates are ISO strings, so a plain
// lexicographic localeCompare sorts chronologically; the computed derives ordering from
// the data instead of relying on JSON order.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '../components/PageHead.vue'
import SectionHead from '../components/SectionHead.vue'
import NewsCard from '../components/NewsCard.vue'
import news from '../data/news.json'

const { t } = useI18n()
const sorted = computed(() => [...news].sort((a, b) => b.date.localeCompare(a.date)))
</script>

<template>
  <PageHead index="05" eyebrow="News" :title="t('news.title')" :lead="t('news.lead')" />

  <section class="section">
    <div class="container">
      <SectionHead :eyebrow="'All'" :title="t('news.allTitle')" />
      <div class="news-grid">
        <NewsCard
          v-for="(n, i) in sorted"
          :key="n.date + i"
          :item="n"
          :featured="i === 0"
          v-reveal="{ delay: (i % 3) * 0.08 + 's' }"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; align-items: stretch; }
@media (max-width: 900px) { .news-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 620px) { .news-grid { grid-template-columns: 1fr; } }
</style>
