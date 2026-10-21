<script setup>
// ===== PublicationsView.vue - Filterable paper list grouped by year, plus patents and awards =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Route: #/publications | Data: publications.json (papers red line: 15) | i18n: pubs.*
// Filter = tag chip AND free-text, case-insensitive over tx(title)/authors/venue; survivors
// are bucketed into descending-year groups. BibTeX copy + DOI links live in PubItem.
// Sections: page head; papers (search box, tag chips, year groups, empty-state line);
// patent rows; awards grid.
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '../components/PageHead.vue'
import SectionHead from '../components/SectionHead.vue'
import PubItem from '../components/PubItem.vue'
import pubs from '../data/publications.json'
import { tx } from '../utils/tx'

const { t } = useI18n()
const q = ref('')
const activeTag = ref('')
const TAGS = ['decoding', 'hanzi', 'microsystem', 'clinical', 'behavior']

// Chip filter and text query combine with AND; an empty query passes everything through.
const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  return pubs.papers.filter((p) => {
    if (activeTag.value && !(p.tags || []).includes(activeTag.value)) return false
    if (!s) return true
    return [tx(p.title), p.authors, p.venue].join(' ').toLowerCase().includes(s)
  })
})

// Bucket the filtered papers by year, newest year first; JSON order kept within a year.
const byYear = computed(() => {
  const m = new Map()
  for (const p of filtered.value) {
    if (!m.has(p.year)) m.set(p.year, [])
    m.get(p.year).push(p)
  }
  return [...m.entries()].sort((a, b) => b[0] - a[0])
})
</script>

<template>
  <PageHead index="04" eyebrow="Publications" :title="t('pubs.title')" :lead="t('pubs.lead')" />

  <section class="section">
    <div class="container">
      <SectionHead :eyebrow="'Papers'" :title="t('pubs.papersTitle')" />
      <p class="pub-note">{{ t('pubs.note') }}</p>

      <!-- Sticky filter toolbar: search + chips + a numeric result count (no new copy). -->
      <div class="filter-bar">
        <div class="filter-main">
          <label class="search">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.6" />
              <path d="m16 16 4.2 4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
            <input
              v-model="q"
              class="filter mono"
              type="search"
              :placeholder="t('pubs.filterPh')"
              :aria-label="t('pubs.filterLabel')"
            />
          </label>
          <span class="filter-count mono" aria-hidden="true">{{ filtered.length }} / {{ pubs.papers.length }}</span>
        </div>

        <!-- Tag chips: re-clicking the active tag clears it; the leading chip always clears -->
        <div class="chips" role="group" :aria-label="t('pubs.filterLabel')">
          <button
            class="chip"
            :class="{ on: !activeTag }"
            :aria-pressed="!activeTag"
            @click="activeTag = ''"
          >{{ t('pubs.tagAll') }}</button>
          <button
            v-for="tag in TAGS"
            :key="tag"
            class="chip"
            :class="{ on: activeTag === tag }"
            :aria-pressed="activeTag === tag"
            @click="activeTag = activeTag === tag ? '' : tag"
          >{{ t('pubs.tag' + tag[0].toUpperCase() + tag.slice(1)) }}</button>
        </div>
      </div>

      <!-- Year groups; PubItem owns per-paper BibTeX copy button and DOI link -->
      <div v-for="[year, list] in byYear" :key="year" class="year-group">
        <h3 class="year-mark" v-reveal>{{ year }}</h3>
        <div class="pub-list">
          <PubItem v-for="(p, i) in list" :key="i" :pub="p" v-reveal="{ delay: i * 0.05 + 's' }" />
        </div>
      </div>
      <p v-if="!byYear.length" class="empty">{{ t('pubs.empty') }}</p>
    </div>
  </section>

  <!-- Patents: bilingual name + grant number (em dash placeholder when missing) -->
  <section class="section alt">
    <div class="container">
      <SectionHead :eyebrow="'Patents'" :title="t('pubs.patentsTitle')" />
      <div class="card patent-row" v-for="(p, i) in pubs.patents" :key="i" v-reveal="{ delay: i * 0.06 + 's' }">
        <span class="patent-idx mono" aria-hidden="true">0{{ i + 1 }}</span>
        <span>{{ tx(p.name) }}</span>
        <span class="mono patent-no">{{ p.no || '—' }}</span>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <SectionHead :eyebrow="'Awards'" :title="t('pubs.awardsTitle')" />
      <div class="grid cols-3">
        <div v-for="(a, i) in pubs.awards" :key="i" class="card hov award" v-reveal="{ delay: i * 0.08 + 's' }">
          <div class="award-year mono grad-text">{{ a.year }}</div>
          <div>{{ tx(a.name) }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pub-note { font-size: 0.78rem; color: var(--warm); margin: 0 0 1rem; }

/* Sticky toolbar sits just below the fixed nav; static on mobile so it never eats
   more than one screen of reading space. */
.filter-bar {
  position: sticky; top: calc(var(--nav-h) + 12px); z-index: 20;
  display: flex; flex-direction: column; gap: 0.8rem;
  margin-bottom: 2.2rem; padding: 1rem 1.1rem;
  border: 1px solid var(--line); border-radius: var(--r-lg);
  background: var(--surface-glass);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  box-shadow: var(--shadow-card);
}
.filter-main { display: flex; align-items: center; gap: 0.8rem; }
.search {
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 0.55rem;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--line); border-radius: var(--r-sm);
  background: rgba(7, 11, 20, 0.52);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(56, 214, 255, 0.12); }
.search-icon { width: 16px; height: 16px; flex: none; color: var(--ink-faint); }
.filter {
  flex: 1; min-width: 0; padding: 0;
  background: transparent; border: 0; color: var(--ink);
  font-size: 0.88rem; outline: none;
}
.filter::placeholder { color: var(--ink-faint); opacity: 0.85; }
.filter-count { flex: none; font-size: 0.72rem; letter-spacing: 0.08em; color: var(--ink-faint); }

.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chip {
  font-size: 0.84rem; line-height: 1.4; color: var(--ink-dim);
  background: var(--bg-2); border: 1px solid var(--line); border-radius: var(--r-pill);
  padding: 0.62rem 1.1rem; cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}
.chip:hover { color: var(--accent); border-color: rgba(56, 214, 255, 0.45); }
.chip.on { color: #06101f; background: var(--grad); border-color: transparent; font-weight: 600; }
.chip.on:hover { color: #06101f; }

.year-group { margin-bottom: 2.4rem; }
.year-mark {
  display: flex; align-items: center; gap: 1rem;
  margin: 0 0 1rem;
  font-family: var(--font-en); font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 700; letter-spacing: -0.02em; color: var(--ink-faint); opacity: 0.55;
}
.year-mark::after {
  content: ""; flex: 1; height: 1px;
  background: linear-gradient(90deg, var(--line), transparent);
}
.pub-list { display: grid; gap: 0.9rem; }
.empty {
  color: var(--ink-dim); text-align: center; padding: 2.4rem 1rem;
  border: 1px dashed var(--line); border-radius: var(--radius);
}
.patent-row {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem;
  margin-bottom: 0.8rem; padding: 1rem 1.3rem;
}
.patent-idx { font-size: 0.72rem; color: var(--ink-faint); }
.patent-no { color: var(--ink-dim); font-size: 0.8rem; }
.award { position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 0.35rem; text-align: left; }
.award::before {
  content: ""; position: absolute; top: 0; left: 1.5rem; right: 1.5rem; height: 1px;
  background: linear-gradient(90deg, rgba(255, 180, 92, 0.55), transparent);
  opacity: 0.45;
}
.award-year { font-size: 1.7rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.2rem; }

@media (max-width: 640px) {
  .filter-bar { position: static; padding: 0.85rem; }
  .filter-main { flex-wrap: wrap; }
  .filter-count { margin-left: auto; }
  .patent-row { grid-template-columns: auto 1fr; }
  .patent-no { grid-column: 2; }
}
</style>
